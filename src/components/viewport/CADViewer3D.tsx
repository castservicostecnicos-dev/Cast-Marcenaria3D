/**
 * MarcenariaCAD Pro - Professional Three.js 3D CAD/CAM Viewport
 * Accurate kinematic door hinge pivoting, drawer sliding extension,
 * global opening slider (0-100%) and individual piece-by-piece click opening.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FurnitureModel, Piece } from '../../types/furniture';
import { BoardMaterial, EdgeTapeMaterial } from '../../types/materials';
import { DEFAULT_EDGE_TAPES } from '../../data/defaultMaterials';

interface CADViewer3DProps {
  furniture: FurnitureModel;
  materials: BoardMaterial[];
  edgeTapes?: EdgeTapeMaterial[];
  selectedPieceId?: string | null;
  onSelectPiece?: (piece: Piece | null) => void;
  renderMode: 'technical' | 'client';
  explodedProgress: number; // 0.0 to 1.0
  openProgress: number;     // 0.0 to 1.0 (slider)
  openItems: Record<string, boolean>; // individual items open states
  onToggleItemOpen?: (itemId: string, type: 'door' | 'drawer') => void;
  showDimensions: boolean;
  showDrillings: boolean;
  autoRotate?: boolean;
  isPresentationMode?: boolean;
}

export const CADViewer3D: React.FC<CADViewer3DProps> = ({
  furniture,
  materials,
  edgeTapes = DEFAULT_EDGE_TAPES,
  selectedPieceId,
  onSelectPiece,
  renderMode,
  explodedProgress,
  openProgress,
  openItems,
  onToggleItemOpen,
  showDimensions,
  showDrillings,
  autoRotate = false,
  isPresentationMode = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const piecesGroupRef = useRef<THREE.Group | null>(null);
  const drillingsGroupRef = useRef<THREE.Group | null>(null);

  // Auto rotate reference
  const autoRotateRef = useRef(autoRotate);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Mouse orbit state
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const cameraRadiusRef = useRef(3000);
  const cameraThetaRef = useRef(Math.PI / 4.5); // azimuth
  const cameraPhiRef = useRef(Math.PI / 2.8);   // elevation

  // Raycaster for piece selection and hover
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseCoordsRef = useRef(new THREE.Vector2());

  // Setup scene, lights, and camera on mount
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(renderMode === 'client' ? 0x090d16 : 0x020617);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 10, 20000);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting (Three-point studio lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, renderMode === 'client' ? 0.85 : 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.3);
    keyLight.position.set(1800, 3200, 3000);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.65);
    fillLight.position.set(-2000, 1800, 2000);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfef08a, 0.45);
    rimLight.position.set(0, -1000, -2000);
    scene.add(rimLight);

    // Floor Grid in Technical Mode
    const gridHelper = new THREE.GridHelper(5000, 50, 0x334155, 0x1e293b);
    gridHelper.position.y = -5;
    scene.add(gridHelper);

    // Groups
    const piecesGroup = new THREE.Group();
    piecesGroupRef.current = piecesGroup;
    scene.add(piecesGroup);

    const drillingsGroup = new THREE.Group();
    drillingsGroupRef.current = drillingsGroup;
    scene.add(drillingsGroup);

    // Initial camera position update
    updateCamera();

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (autoRotateRef.current && !isDraggingRef.current && !isPanningRef.current) {
        cameraThetaRef.current += 0.0035;
        updateCamera();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update background color based on renderMode
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(renderMode === 'client' ? 0x090d16 : 0x020617);
    }
  }, [renderMode]);

  // Update Camera Orbit Position
  function updateCamera() {
    if (!cameraRef.current) return;
    const r = cameraRadiusRef.current;
    const theta = cameraThetaRef.current;
    const phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, cameraPhiRef.current));
    const target = cameraTargetRef.current;

    const x = target.x + r * Math.sin(phi) * Math.sin(theta);
    const y = target.y + r * Math.cos(phi);
    const z = target.z + r * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  }

  // Preset view angles (looking at the FRONT of cabinet at +Z)
  const setView = (view: 'iso' | 'front' | 'top' | 'side') => {
    if (view === 'iso') {
      cameraThetaRef.current = Math.PI / 4;
      cameraPhiRef.current = Math.PI / 2.8;
    } else if (view === 'front') {
      cameraThetaRef.current = 0;
      cameraPhiRef.current = Math.PI / 2 - 0.02;
    } else if (view === 'top') {
      cameraThetaRef.current = 0;
      cameraPhiRef.current = 0.05;
    } else if (view === 'side') {
      cameraThetaRef.current = Math.PI / 2;
      cameraPhiRef.current = Math.PI / 2 - 0.02;
    }
    updateCamera();
  };

  // Build 3D Furniture Meshes with Physical Hinge Pivoting and Drawer Slides
  useEffect(() => {
    if (!piecesGroupRef.current || !drillingsGroupRef.current || !sceneRef.current) return;

    // Clear old pieces
    while (piecesGroupRef.current.children.length > 0) {
      const obj = piecesGroupRef.current.children[0];
      piecesGroupRef.current.remove(obj);
    }

    // Clear old drillings
    while (drillingsGroupRef.current.children.length > 0) {
      const obj = drillingsGroupRef.current.children[0];
      drillingsGroupRef.current.remove(obj);
    }

    // Center of furniture for world coordinate centering
    const centerX = furniture.width / 2;
    const centerY = furniture.height / 2;
    const centerZ = furniture.depth / 2;

    cameraTargetRef.current.set(0, centerY, 0);
    cameraRadiusRef.current = Math.max(furniture.width, furniture.height) * 2.1;
    updateCamera();

    // Map material colors
    const materialColorMap = new Map<string, number>();
    materials.forEach(m => {
      const hex = parseInt(m.colorHex.replace('#', '0x'), 16);
      materialColorMap.set(m.id, hex);
    });

    // Helper: extract drawer key (all parts of drawer d in module m share this key)
    const getDrawerKey = (p: Piece) => {
      if (!p.type.startsWith('drawer_')) return null;
      // Match pattern like _0_1 at the end of piece.id
      const match = p.id.match(/_(\d+)_(\d+)$/);
      if (match) {
        return `drawer_${p.moduleId}_${match[1]}_${match[2]}`;
      }
      const parts = p.id.split('_');
      const dIdx = parts[parts.length - 1];
      const mIdx = parts[parts.length - 2];
      return `drawer_${p.moduleId}_${mIdx}_${dIdx}`;
    };

    // Shared Handle Material (Black anodized metal)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25
    });

    furniture.pieces.forEach(piece => {
      const isSelected = piece.id === selectedPieceId;
      const dims = piece.dimensions3D;

      // Base geometry (Box)
      const geometry = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);

      // Color from material
      const matHex = materialColorMap.get(piece.materialId) || (piece.type === 'back' ? 0x94a3b8 : 0xd97706);

      // Material
      let material: THREE.Material;
      if (renderMode === 'client' || isPresentationMode) {
        material = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xf59e0b : matHex,
          roughness: 0.55,
          metalness: 0.1,
          emissive: isSelected ? 0x78350f : 0x000000,
          emissiveIntensity: isSelected ? 0.35 : 0
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xf59e0b : matHex,
          roughness: 0.5,
          metalness: 0.05,
          emissive: isSelected ? 0xb45309 : 0x000000,
          emissiveIntensity: isSelected ? 0.3 : 0
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Base position in world space:
      // X: left to right, centered at 0
      // Y: floor up, centered vertically at centerY
      // Z: FRONT of cabinet is at +centerZ, BACK of cabinet is at -centerZ
      let posX = piece.position.x + dims.width / 2 - centerX;
      let posY = piece.position.y + dims.height / 2;
      let posZ = centerZ - (piece.position.z + dims.depth / 2);

      // Apply Exploded View Displacement
      if (explodedProgress > 0) {
        const factor = explodedProgress * 380;
        const dx = (posX > 0 ? 1 : posX < 0 ? -1 : 0) * factor * 0.8;
        const dy = (posY > centerY ? 1 : -1) * factor * 0.5;
        const dz = (posZ > 0 ? 1 : -1) * factor * 0.85;

        posX += dx;
        posY += dy;
        posZ += dz;
      }

      // Add edge highlight lines in Technical mode
      if (renderMode === 'technical' && !isPresentationMode) {
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMat = new THREE.LineBasicMaterial({
          color: isSelected ? 0xffffff : 0x0f172a,
          linewidth: 1.5
        });
        const line = new THREE.LineSegments(edges, lineMat);
        mesh.add(line);
      }

      // -------------------------------------------------------------
      // 3D REALISTIC EDGE BANDING (FITAS DE BORDA) WITH ACTUAL COLOR
      // -------------------------------------------------------------
      const eb = piece.edgeBanding;
      if (eb && (eb.top || eb.bottom || eb.left || eb.right)) {
        // Resolve Edge Tape Color
        const tape = edgeTapes.find(t => t.id === eb.tapeMaterialId) ||
          DEFAULT_EDGE_TAPES.find(t => t.id === eb.tapeMaterialId) ||
          edgeTapes[0] ||
          DEFAULT_EDGE_TAPES[0];
        const tapeHex = tape ? parseInt(tape.colorHex.replace('#', '0x'), 16) : 0xa27045;

        // Ribbon thickness (slightly extruded so it covers the edge and is visible)
        const tapeThick = Math.max(1.8, (eb.tapeThickness || 1.0) * 1.8);
        const tapeMat = new THREE.MeshStandardMaterial({
          color: tapeHex,
          roughness: 0.35,
          metalness: 0.15,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        });

        // Fine contour border for the tape in technical mode
        const tapeBorderMat = new THREE.LineBasicMaterial({
          color: isSelected ? 0xffffff : 0x0284c7,
          linewidth: 2
        });

        const addTapeStrip = (geom: THREE.BoxGeometry, x: number, y: number, z: number) => {
          const stripMesh = new THREE.Mesh(geom, tapeMat);
          stripMesh.position.set(x, y, z);
          mesh.add(stripMesh);

          if (renderMode === 'technical' && !isPresentationMode) {
            const stripEdges = new THREE.EdgesGeometry(geom);
            const stripLines = new THREE.LineSegments(stripEdges, tapeBorderMat);
            stripMesh.add(stripLines);
          }
        };

        const w = dims.width;
        const h = dims.height;
        const d = dims.depth;

        // Categorize 3D piece geometry orientation
        if (piece.type === 'lateral_left' || piece.type === 'lateral_right' || piece.type === 'divider_vertical') {
          // Vertical Carcase Sides: Width is thickness (X), Height is Y, Depth is Z
          // Left = front edge (+Z)
          if (eb.left) {
            addTapeStrip(new THREE.BoxGeometry(w + 0.1, h + 0.1, tapeThick), 0, 0, d / 2 + tapeThick / 2);
          }
          // Right = back edge (-Z)
          if (eb.right) {
            addTapeStrip(new THREE.BoxGeometry(w + 0.1, h + 0.1, tapeThick), 0, 0, -d / 2 - tapeThick / 2);
          }
          // Top = upper edge (+Y)
          if (eb.top) {
            addTapeStrip(new THREE.BoxGeometry(w + 0.1, tapeThick, d + 0.1), 0, h / 2 + tapeThick / 2, 0);
          }
          // Bottom = lower edge (-Y)
          if (eb.bottom) {
            addTapeStrip(new THREE.BoxGeometry(w + 0.1, tapeThick, d + 0.1), 0, -h / 2 - tapeThick / 2, 0);
          }
        } else if (
          piece.type === 'base' ||
          piece.type === 'top' ||
          piece.type === 'shelf_fixed' ||
          piece.type === 'shelf_adjustable' ||
          piece.type === 'plinth'
        ) {
          // Horizontal Panels: Width is span (X), Height is thickness (Y), Depth is depth (Z)
          // Top = front edge (+Z, visible edge)
          if (eb.top) {
            addTapeStrip(new THREE.BoxGeometry(w + 0.1, h + 0.1, tapeThick), 0, 0, d / 2 + tapeThick / 2);
          }
          // Bottom = rear edge (-Z)
          if (eb.bottom) {
            addTapeStrip(new THREE.BoxGeometry(w + 0.1, h + 0.1, tapeThick), 0, 0, -d / 2 - tapeThick / 2);
          }
          // Left = left edge (-X)
          if (eb.left) {
            addTapeStrip(new THREE.BoxGeometry(tapeThick, h + 0.1, d + 0.1), -w / 2 - tapeThick / 2, 0, 0);
          }
          // Right = right edge (+X)
          if (eb.right) {
            addTapeStrip(new THREE.BoxGeometry(tapeThick, h + 0.1, d + 0.1), w / 2 + tapeThick / 2, 0, 0);
          }
        } else if (piece.type === 'drawer_side') {
          // Drawer Sides: Width is thickness (X), Height is Y, Depth is length (Z)
          // Top = top rim of drawer box (+Y, very important and visible when drawer opens!)
          if (eb.top) {
            addTapeStrip(new THREE.BoxGeometry(w + 0.1, tapeThick, d + 0.1), 0, h / 2 + tapeThick / 2, 0);
          }
          // Bottom = bottom rim (-Y)
          if (eb.bottom) {
            addTapeStrip(new THREE.BoxGeometry(w + 0.1, tapeThick, d + 0.1), 0, -h / 2 - tapeThick / 2, 0);
          }
          // Left = front face (+Z)
          if (eb.left) {
            addTapeStrip(new THREE.BoxGeometry(w + 0.1, h + 0.1, tapeThick), 0, 0, d / 2 + tapeThick / 2);
          }
          // Right = back face (-Z)
          if (eb.right) {
            addTapeStrip(new THREE.BoxGeometry(w + 0.1, h + 0.1, tapeThick), 0, 0, -d / 2 - tapeThick / 2);
          }
        } else {
          // Front-facing Panels (Doors, Drawer Fronts, Contrafrente, Traseira): Width is X, Height is Y, Depth is thickness (Z)
          // Top = upper edge (+Y)
          if (eb.top) {
            addTapeStrip(new THREE.BoxGeometry(w + 0.1, tapeThick, d + 0.1), 0, h / 2 + tapeThick / 2, 0);
          }
          // Bottom = lower edge (-Y)
          if (eb.bottom) {
            addTapeStrip(new THREE.BoxGeometry(w + 0.1, tapeThick, d + 0.1), 0, -h / 2 - tapeThick / 2, 0);
          }
          // Left = left edge (-X)
          if (eb.left) {
            addTapeStrip(new THREE.BoxGeometry(tapeThick, h + 0.1, d + 0.1), -w / 2 - tapeThick / 2, 0, 0);
          }
          // Right = right edge (+X)
          if (eb.right) {
            addTapeStrip(new THREE.BoxGeometry(tapeThick, h + 0.1, d + 0.1), w / 2 + tapeThick / 2, 0, 0);
          }
        }
      }

      // -------------------------------------------------------------
      // 1. DOOR WITH REALISTIC HINGE PIVOTING
      // -------------------------------------------------------------
      if (piece.type === 'door') {
        // Determine open fraction: individual click overrides or takes slider
        const isIndividuallyToggled = openItems[piece.id] !== undefined;
        const openFraction = isIndividuallyToggled
          ? (openItems[piece.id] ? 1.0 : 0.0)
          : openProgress;

        const maxAngle = Math.PI / 1.72; // ~105 degrees open angle
        const openAngle = openFraction * maxAngle;

        // Determine hinge side: Left or Right
        const isRightHinged = piece.hingeSide === 'right' || piece.code.includes('DIR') || piece.name.toLowerCase().includes('direita');

        // Hinge position in world space:
        // Left hinge is at the piece left edge; Right hinge is at the piece right edge
        const leftEdgeX = piece.position.x - centerX;
        const rightEdgeX = piece.position.x + dims.width - centerX;
        const hingeX = isRightHinged ? rightEdgeX : leftEdgeX;
        const hingeZ = centerZ; // front plane of cabinet carcase

        // Create Hinge Pivot Group
        const pivotGroup = new THREE.Group();
        pivotGroup.position.set(hingeX, posY, hingeZ);

        // Store user data on mesh for raycaster click handling
        mesh.userData = {
          pieceId: piece.id,
          piece,
          isDoor: true,
          isOpen: openFraction > 0.05
        };

        // Position door relative to hinge inside pivot group:
        // Back face of door sits flush with front of carcase (Z = dims.depth / 2)
        // If left hinge, door body extends in +X; if right hinge, door body extends in -X
        const localMeshX = isRightHinged ? -dims.width / 2 : dims.width / 2;
        mesh.position.set(localMeshX, 0, dims.depth / 2);

        // Add Realistic Door Handle (Puxador Barra Preto)
        const handleGeom = new THREE.BoxGeometry(14, 160, 24);
        const handleMesh = new THREE.Mesh(handleGeom, handleMaterial);
        // Position handle near free edge (opposite side of hinge)
        const handleX = isRightHinged ? (-dims.width / 2 + 35) : (dims.width / 2 - 35);
        handleMesh.position.set(handleX, 0, dims.depth / 2 + 12);
        mesh.add(handleMesh);

        // Render Hinge Cup Drillings (Ø35mm) on the back face of the door (rotates with door)
        if (showDrillings && renderMode === 'technical' && !isPresentationMode && piece.drillings.length > 0) {
          piece.drillings.forEach(d => {
            const r = Math.max(2, d.diameter / 2);
            const drillGeom = new THREE.CylinderGeometry(r, r, d.depth > 0 ? d.depth : 12.5, 16);
            const drillMat = new THREE.MeshBasicMaterial({
              color: d.type === 'hinge_cup' ? 0xef4444 : 0x06b6d4
            });
            const drillMesh = new THREE.Mesh(drillGeom, drillMat);
            // In local door coordinates:
            const hx = -dims.width / 2 + d.x;
            const hy = -dims.height / 2 + d.y;
            const hz = -dims.depth / 2;
            drillMesh.position.set(hx, hy, hz);
            drillMesh.rotation.x = Math.PI / 2;
            mesh.add(drillMesh);
          });
        }

        pivotGroup.add(mesh);

        // Apply physical door rotation around vertical Y-axis:
        // Left door swings out with -openAngle (towards +Z into the room);
        // Right door swings out with +openAngle (towards +Z into the room)
        pivotGroup.rotation.y = isRightHinged ? openAngle : -openAngle;

        piecesGroupRef.current?.add(pivotGroup);
      }
      // -------------------------------------------------------------
      // 2. DRAWER WITH REALISTIC SLIDE FORWARD
      // -------------------------------------------------------------
      else if (piece.type.startsWith('drawer_')) {
        const drawerKey = getDrawerKey(piece);
        const isIndividuallyToggled = drawerKey ? openItems[drawerKey] !== undefined : false;
        const openFraction = isIndividuallyToggled
          ? (openItems[drawerKey!] ? 1.0 : 0.0)
          : openProgress;

        // Slide forward stroke (up to 340mm into the room towards +Z)
        const slideZ = openFraction * 340;
        posZ += slideZ;

        mesh.userData = {
          pieceId: piece.id,
          piece,
          isDrawer: true,
          drawerKey,
          isOpen: openFraction > 0.05
        };
        mesh.position.set(posX, posY, posZ);

        // Add Handle to Drawer Front Plate
        if (piece.type === 'drawer_front') {
          const handleGeom = new THREE.BoxGeometry(160, 14, 24);
          const handleMesh = new THREE.Mesh(handleGeom, handleMaterial);
          handleMesh.position.set(0, 0, dims.depth / 2 + 12);
          mesh.add(handleMesh);
        }

        // Add Metallic Telescopic Runner to Drawer Sides
        if (piece.type === 'drawer_side') {
          const isLeft = piece.id.includes('esq') || piece.code.includes('ESQ');
          const slideMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8, // metallic steel zinc
            metalness: 0.85,
            roughness: 0.25
          });
          const runnerGeom = new THREE.BoxGeometry(8, 35, dims.depth - 20);
          const runnerMesh = new THREE.Mesh(runnerGeom, slideMat);
          const runnerX = isLeft ? -dims.width / 2 - 4 : dims.width / 2 + 4;
          runnerMesh.position.set(runnerX, -dims.height / 2 + 25, 0);
          mesh.add(runnerMesh);
        }

        piecesGroupRef.current?.add(mesh);
      }
      // -------------------------------------------------------------
      // 3. REGULAR STRUCTURAL PIECES (Laterals, Base, Shelves, Back)
      // -------------------------------------------------------------
      else {
        mesh.userData = { pieceId: piece.id, piece };
        mesh.position.set(posX, posY, posZ);
        piecesGroupRef.current?.add(mesh);
      }

      // Render Drillings (Furações) as 3D markers in Technical Mode for structural pieces
      if (showDrillings && renderMode === 'technical' && !isPresentationMode && piece.drillings.length > 0 && piece.type !== 'door') {
        piece.drillings.forEach(d => {
          const radius = Math.max(2, d.diameter / 2);
          const depth = d.depth > 0 ? Math.min(d.depth, piece.thickness) : piece.thickness;
          const drillGeom = new THREE.CylinderGeometry(radius, radius, depth + 2, 16);
          const drillColor = d.type === 'hinge_cup' ? 0xef4444 :
            d.type === 'minifix_cam' ? 0x10b981 :
            d.type === 'dowel' ? 0xf59e0b :
            d.type === 'system32' ? 0x06b6d4 : 0xa855f7;
          const drillMat = new THREE.MeshBasicMaterial({ color: drillColor });
          const drillMesh = new THREE.Mesh(drillGeom, drillMat);

          if (piece.type === 'lateral_left') {
            // Holes are on inner face of left lateral (facing +X into cabinet)
            // d.x is depth from front edge (37mm or 531mm)
            // d.y is height from bottom of lateral
            const holeX = posX + dims.width / 2;
            const holeY = (posY - dims.height / 2) + d.y;
            const holeZ = (posZ + dims.depth / 2) - d.x;
            drillMesh.position.set(holeX, holeY, holeZ);
            drillMesh.rotation.z = Math.PI / 2;
            drillingsGroupRef.current?.add(drillMesh);
          } else if (piece.type === 'lateral_right') {
            // Holes are on inner face of right lateral (facing -X into cabinet)
            const holeX = posX - dims.width / 2;
            const holeY = (posY - dims.height / 2) + d.y;
            const holeZ = (posZ + dims.depth / 2) - d.x;
            drillMesh.position.set(holeX, holeY, holeZ);
            drillMesh.rotation.z = Math.PI / 2;
            drillingsGroupRef.current?.add(drillMesh);
          } else if (piece.type === 'divider_vertical') {
            // Divider holes in center / faces
            const holeX = posX;
            const holeY = (posY - dims.height / 2) + d.y;
            const holeZ = (posZ + dims.depth / 2) - d.x;
            drillMesh.position.set(holeX, holeY, holeZ);
            drillMesh.rotation.z = Math.PI / 2;
            drillingsGroupRef.current?.add(drillMesh);
          } else if (piece.type === 'base' || piece.type === 'top') {
            // Minifix and dowel holes on underside of base/top
            // d.x is along span/length from left edge
            // d.y is along depth from front edge
            const holeX = (posX - dims.width / 2) + d.x;
            const holeY = posY - dims.height / 2;
            const holeZ = (posZ + dims.depth / 2) - d.y;
            drillMesh.position.set(holeX, holeY, holeZ);
            drillingsGroupRef.current?.add(drillMesh);
          } else if (piece.type === 'drawer_front') {
            // Handle mounting holes on drawer front
            const holeX = (posX - dims.width / 2) + d.x;
            const holeY = (posY - dims.height / 2) + d.y;
            const holeZ = posZ + dims.depth / 2;
            drillMesh.position.set(holeX, holeY, holeZ);
            drillMesh.rotation.x = Math.PI / 2;
            drillingsGroupRef.current?.add(drillMesh);
          } else if (piece.type === 'drawer_side') {
            // Slide mounting pilot holes on outer face of drawer side
            const isLeft = piece.id.includes('esq') || piece.code.includes('ESQ');
            const holeX = isLeft ? posX - dims.width / 2 : posX + dims.width / 2;
            const holeY = (posY - dims.height / 2) + d.y;
            const holeZ = (posZ + dims.depth / 2) - d.x;
            drillMesh.position.set(holeX, holeY, holeZ);
            drillMesh.rotation.z = Math.PI / 2;
            drillingsGroupRef.current?.add(drillMesh);
          } else if (piece.type === 'drawer_subfront') {
            // Subfront through-screws into drawer front plate
            const holeX = (posX - dims.width / 2) + d.x;
            const holeY = (posY - dims.height / 2) + d.y;
            const holeZ = posZ - dims.depth / 2;
            drillMesh.position.set(holeX, holeY, holeZ);
            drillMesh.rotation.x = Math.PI / 2;
            drillingsGroupRef.current?.add(drillMesh);
          } else {
            // Generic placement
            drillMesh.position.set(
              (posX - dims.width / 2) + d.x,
              (posY - dims.height / 2) + d.y,
              posZ + dims.depth / 2
            );
            drillMesh.rotation.x = Math.PI / 2;
            drillingsGroupRef.current?.add(drillMesh);
          }
        });
      }
    });
  }, [
    furniture,
    materials,
    edgeTapes,
    selectedPieceId,
    renderMode,
    explodedProgress,
    openProgress,
    openItems,
    showDrillings,
    isPresentationMode
  ]);

  // Mouse Interaction Handlers (Orbit, Pan, Zoom, Click Selection & Toggle Opening)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
    } else if (e.button === 2 || e.button === 1) {
      isPanningRef.current = true;
    }
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (isDraggingRef.current) {
      // Rotate Orbit
      cameraThetaRef.current -= deltaX * 0.008;
      cameraPhiRef.current -= deltaY * 0.008;
      updateCamera();
    } else if (isPanningRef.current) {
      // Pan
      const panSpeed = cameraRadiusRef.current * 0.001;
      cameraTargetRef.current.x -= deltaX * panSpeed;
      cameraTargetRef.current.y += deltaY * panSpeed;
      updateCamera();
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY * 1.5;
    cameraRadiusRef.current = Math.max(200, Math.min(12000, cameraRadiusRef.current + zoomFactor));
    updateCamera();
  };

  // Piece Click Selection & Individual Opening Toggle
  const handleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || !cameraRef.current || !piecesGroupRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    mouseCoordsRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseCoordsRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseCoordsRef.current, cameraRef.current);

    // Intersect all meshes in the scene
    const intersects = raycasterRef.current.intersectObjects(piecesGroupRef.current.children, true);

    if (intersects.length > 0) {
      // Find object with userData
      let hitMesh: THREE.Object3D | null = intersects[0].object;
      while (hitMesh && !hitMesh.userData.piece && hitMesh.parent && hitMesh !== piecesGroupRef.current) {
        hitMesh = hitMesh.parent;
      }

      if (hitMesh && hitMesh.userData.piece) {
        const piece = hitMesh.userData.piece as Piece;

        // Individual item opening toggle
        if (piece.type === 'door') {
          if (onToggleItemOpen) {
            onToggleItemOpen(piece.id, 'door');
          }
        } else if (piece.type.startsWith('drawer_')) {
          const key = hitMesh.userData.drawerKey || piece.id;
          if (onToggleItemOpen) {
            onToggleItemOpen(key, 'drawer');
          }
        }

        // Selection in technical mode
        if (!isPresentationMode && onSelectPiece) {
          onSelectPiece(piece);
        }
        return;
      }
    }

    if (!isPresentationMode && onSelectPiece) {
      onSelectPiece(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden select-none"
      onContextMenu={e => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {/* Floating HUD Camera Presets */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-lg p-1 text-xs shadow-lg">
        <button
          onClick={() => setView('iso')}
          className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
          title="Vista Isométrica Frontal 3D"
        >
          3D ISO
        </button>
        <button
          onClick={() => setView('front')}
          className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
          title="Elevação Frontal das Portas"
        >
          Frontal
        </button>
        <button
          onClick={() => setView('top')}
          className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
          title="Planta Superior"
        >
          Planta
        </button>
        <button
          onClick={() => setView('side')}
          className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
          title="Elevação Lateral"
        >
          Lateral
        </button>
      </div>

      {/* Floating Helper Legend (Only in Technical Mode) */}
      {!isPresentationMode && (
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 text-[11px] text-slate-400 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-lg shadow-md">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
            Fita de Borda
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            Caneco 35mm
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            Minifix 15mm
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
            Furos Sist. 32
          </span>
        </div>
      )}

      {/* Instructions Overlay */}
      <div className="absolute top-4 right-4 z-10 text-[11px] text-slate-400 bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 px-3 py-1.5 rounded-md pointer-events-none">
        Clique em qualquer porta ou gaveta para abrir/fechar individualmente · Arraste para orbitar
      </div>
    </div>
  );
};
