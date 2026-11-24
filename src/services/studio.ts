import PocketBase from 'pocketbase'

export type ProjectRecord = {
  id: string
  title: string
  productionType: string
  status: 'Draft' | 'In progress' | 'Rendering' | 'Complete'
  progress: number
  coverStyle: string
  owner: string
  updated: string
}

export type CharacterRecord = {
  id: string
  name: string
  role: string
  description: string
  project: string
  referenceImage?: string[]
}

const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'
export const pocketbase = new PocketBase(pbUrl)

export async function ensureDemoSession() {
  if (pocketbase.authStore.isValid) return pocketbase.authStore.record

  const email = import.meta.env.VITE_POCKETBASE_EMAIL
  const password = import.meta.env.VITE_POCKETBASE_PASSWORD
  if (!email || !password) {
    throw new Error('PocketBase demo credentials are not configured')
  }

  const auth = await pocketbase.collection('users').authWithPassword(
    email,
    password,
  )
  return auth.record
}

export async function listProjects(): Promise<ProjectRecord[]> {
  await ensureDemoSession()
  const records = await pocketbase.collection('projects').getList(1, 50)

  return records.items.map((record) => ({
    id: record.id,
    title: record.title,
    productionType: record.productionType,
    status: record.status,
    progress: record.progress || 0,
    coverStyle: record.coverStyle || 'ember',
    owner: record.owner,
    updated: record.updated,
  }))
}

export async function createProject(input: {
  title: string
  productionType: string
}) {
  const user = await ensureDemoSession()
  return pocketbase.collection('projects').create({
    title: input.title,
    productionType: input.productionType,
    status: 'Draft',
    progress: 0,
    coverStyle: 'ember',
    owner: user?.id,
  })
}

export async function listCharacters(projectId?: string): Promise<CharacterRecord[]> {
  await ensureDemoSession()
  const records = await pocketbase.collection('characters').getList(1, 100, {
    filter: projectId ? `project = "${projectId}"` : undefined,
    sort: 'name',
  })
  return records.items.map((record) => ({
    id: record.id,
    name: record.name,
    role: record.role || '',
    description: record.description || '',
    project: record.project,
    referenceImage: record.referenceImage,
  }))
}
