/**
 * MarcenariaCAD Pro - Local Storage & Version Control Service
 * Manages projects, clients, version history snapshots, and JSON backup/restore.
 */

import { Project, ProjectVersion, FurnitureModel } from '../types/furniture';
import { FURNITURE_TEMPLATES } from '../data/templates';

const STORAGE_KEY_PROJECTS = 'marcenariacad_projects_v1';
const STORAGE_KEY_ACTIVE_PROJECT_ID = 'marcenariacad_active_id_v1';

export function createInitialProject(): Project {
  const template = FURNITURE_TEMPLATES[0]; // Balcão 4 módulos
  const initialFurniture = template.create();

  const initialVersion: ProjectVersion = {
    id: `ver_${Date.now()}_1`,
    versionNumber: 1,
    timestamp: new Date().toISOString(),
    description: 'Versão inicial gerada por template paramétrico',
    snapshot: initialFurniture
  };

  return {
    id: `proj_${Date.now()}`,
    name: 'Cozinha Planejada - Módulos Balcão',
    client: {
      name: 'Residência Silva',
      email: 'contato@cliente.com.br',
      phone: '(11) 98765-4321',
      address: 'São Paulo - SP'
    },
    room: {
      id: 'room_cozinha',
      name: 'Cozinha Gourmet',
      roomType: 'cozinha',
      dimensions: {
        width: 3600,
        length: 2800,
        height: 2600
      }
    },
    furniture: initialFurniture,
    versions: [initialVersion],
    currentVersionIndex: 0,
    notes: 'Projeto paramétrico pronto para fabricação com furação Sistema 32 e corrediças soft-close.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function loadAllProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) {
      const initial = createInitialProject();
      saveAllProjects([initial]);
      return [initial];
    }
    const projects: Project[] = JSON.parse(raw);
    return projects.length > 0 ? projects : [createInitialProject()];
  } catch (e) {
    console.error('Error loading projects from storage:', e);
    const initial = createInitialProject();
    return [initial];
  }
}

export function saveAllProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  } catch (e) {
    console.error('Error saving projects to storage:', e);
  }
}

export function saveProject(project: Project): void {
  const projects = loadAllProjects();
  const index = projects.findIndex(p => p.id === project.id);
  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString()
  };

  if (index >= 0) {
    projects[index] = updatedProject;
  } else {
    projects.push(updatedProject);
  }
  saveAllProjects(projects);
}

export function createNewProjectVersion(project: Project, description: string): Project {
  const newVerNumber = project.versions.length + 1;
  const newVersion: ProjectVersion = {
    id: `ver_${Date.now()}_${newVerNumber}`,
    versionNumber: newVerNumber,
    timestamp: new Date().toISOString(),
    description,
    snapshot: JSON.parse(JSON.stringify(project.furniture))
  };

  const updated: Project = {
    ...project,
    versions: [...project.versions, newVersion],
    currentVersionIndex: project.versions.length,
    updatedAt: new Date().toISOString()
  };

  saveProject(updated);
  return updated;
}
