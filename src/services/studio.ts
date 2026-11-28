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
  referenceUrl?: string
}

export type LocationRecord = {
  id: string
  name: string
  description: string
  project: string
  referenceUrl?: string
}

export type ScriptRecord = {
  id: string
  title: string
  documentType: 'Screenplay' | 'Outline' | 'Notes'
  content: string
  project: string
}

export type SceneRecord = {
  id: string
  title: string
  sequence: number
  synopsis: string
  project: string
  scriptId: string
  scriptTitle: string
}

export type ShotRecord = {
  id: string
  title: string
  order: number
  description: string
  framing: 'Extreme wide' | 'Wide' | 'Medium' | 'Close-up' | 'Extreme close-up'
  cameraMovement: 'Static' | 'Pan' | 'Tilt' | 'Dolly' | 'Tracking' | 'Handheld'
  durationSeconds: number
  prompt: string
  scene: string
  project: string
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
    referenceUrl: record.referenceImage?.[0]
      ? pocketbase.files.getURL(record, record.referenceImage[0])
      : undefined,
  }))
}

export async function createCharacter(input: {
  name: string
  role: string
  description: string
  projectId: string
  referenceImage?: File
}) {
  const user = await ensureDemoSession()
  if (!user?.id) {
    throw new Error('PocketBase session is missing a user ID')
  }
  const formData = new FormData()
  formData.set('name', input.name.trim())
  formData.set('role', input.role.trim())
  formData.set('description', input.description.trim())
  formData.set('project', input.projectId)
  formData.set('owner', user.id)
  if (input.referenceImage) {
    formData.set('referenceImage', input.referenceImage)
  }

  return pocketbase.collection('characters').create(formData)
}

export async function listLocations(projectId?: string): Promise<LocationRecord[]> {
  await ensureDemoSession()
  const records = await pocketbase.collection('locations').getList(1, 100, {
    filter: projectId ? `project = "${projectId}"` : undefined,
    sort: 'name',
  })
  return records.items.map((record) => ({
    id: record.id,
    name: record.name,
    description: record.description || '',
    project: record.project,
    referenceUrl: record.referenceImage?.[0]
      ? pocketbase.files.getURL(record, record.referenceImage[0])
      : undefined,
  }))
}

export async function createLocation(input: {
  name: string
  description: string
  projectId: string
  referenceImage?: File
}) {
  const user = await ensureDemoSession()
  if (!user?.id) {
    throw new Error('PocketBase session is missing a user ID')
  }
  const formData = new FormData()
  formData.set('name', input.name.trim())
  formData.set('description', input.description.trim())
  formData.set('project', input.projectId)
  formData.set('owner', user.id)
  if (input.referenceImage) {
    formData.set('referenceImage', input.referenceImage)
  }

  return pocketbase.collection('locations').create(formData)
}

export async function listScripts(projectId: string): Promise<ScriptRecord[]> {
  await ensureDemoSession()
  const records = await pocketbase.collection('scripts').getList(1, 100, {
    filter: `project = "${projectId}"`,
    sort: 'title',
  })
  return records.items.map((record) => ({
    id: record.id,
    title: record.title,
    documentType: record.documentType,
    content: record.content || '',
    project: record.project,
  }))
}

export async function createScript(projectId: string) {
  const user = await ensureDemoSession()
  if (!user?.id) {
    throw new Error('PocketBase session is missing a user ID')
  }
  return pocketbase.collection('scripts').create({
    title: 'Untitled script',
    documentType: 'Screenplay',
    content: '',
    project: projectId,
    owner: user.id,
  })
}

export async function updateScript(
  id: string,
  input: Pick<ScriptRecord, 'title' | 'documentType' | 'content'>,
) {
  await ensureDemoSession()
  return pocketbase.collection('scripts').update(id, input)
}

export async function listScenes(projectId: string): Promise<SceneRecord[]> {
  await ensureDemoSession()
  const records = await pocketbase.collection('scenes').getList(1, 200, {
    filter: `project = "${projectId}"`,
    sort: 'sequence',
    expand: 'script',
  })
  return records.items.map((record) => ({
    id: record.id,
    title: record.title,
    sequence: record.sequence,
    synopsis: record.synopsis || '',
    project: record.project,
    scriptId: record.script || '',
    scriptTitle: record.expand?.script?.title || '',
  }))
}

export async function createScene(input: {
  title: string
  sequence: number
  synopsis: string
  projectId: string
  scriptId?: string
}) {
  const user = await ensureDemoSession()
  if (!user?.id) {
    throw new Error('PocketBase session is missing a user ID')
  }
  return pocketbase.collection('scenes').create({
    title: input.title.trim(),
    sequence: input.sequence,
    synopsis: input.synopsis.trim(),
    project: input.projectId,
    script: input.scriptId || '',
    owner: user.id,
  })
}

export async function updateScene(
  id: string,
  input: Pick<SceneRecord, 'title' | 'sequence' | 'synopsis' | 'scriptId'>,
) {
  await ensureDemoSession()
  return pocketbase.collection('scenes').update(id, {
    title: input.title.trim(),
    sequence: input.sequence,
    synopsis: input.synopsis.trim(),
    script: input.scriptId || '',
  })
}

export async function deleteScene(id: string) {
  await ensureDemoSession()
  return pocketbase.collection('scenes').delete(id)
}

export async function listShots(sceneId: string): Promise<ShotRecord[]> {
  await ensureDemoSession()
  const records = await pocketbase.collection('shots').getList(1, 200, {
    filter: `scene = "${sceneId}"`,
    sort: 'order',
  })
  return records.items.map((record) => ({
    id: record.id,
    title: record.title,
    order: record.order,
    description: record.description || '',
    framing: record.framing || 'Medium',
    cameraMovement: record.cameraMovement || 'Static',
    durationSeconds: record.durationSeconds || 5,
    prompt: record.prompt || '',
    scene: record.scene,
    project: record.project,
  }))
}

export async function createShot(input: {
  sceneId: string
  projectId: string
  order: number
}) {
  const user = await ensureDemoSession()
  if (!user?.id) {
    throw new Error('PocketBase session is missing a user ID')
  }
  return pocketbase.collection('shots').create({
    title: `Shot ${String(input.order).padStart(2, '0')}`,
    order: input.order,
    description: '',
    framing: 'Medium',
    cameraMovement: 'Static',
    durationSeconds: 5,
    prompt: '',
    scene: input.sceneId,
    project: input.projectId,
    owner: user.id,
  })
}

export async function updateShot(
  id: string,
  input: Pick<ShotRecord, 'title' | 'order' | 'description' | 'framing' | 'cameraMovement' | 'durationSeconds' | 'prompt'>,
) {
  await ensureDemoSession()
  return pocketbase.collection('shots').update(id, input)
}

export async function deleteShot(id: string) {
  await ensureDemoSession()
  return pocketbase.collection('shots').delete(id)
}
