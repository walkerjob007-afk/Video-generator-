import { useEffect, useState } from 'react'
import { Clapperboard, Film, Plus, Save, Trash2 } from 'lucide-react'
import {
  createScene,
  createShot,
  deleteScene,
  deleteShot,
  listScenes,
  listScripts,
  listShots,
  updateScene,
  updateShot,
  type SceneRecord,
  type ScriptRecord,
  type ShotRecord,
} from '../services/studio'

type SceneProject = {
  id: string
  title: string
}

type SceneStudioProps = {
  projectId: string
  projects: SceneProject[]
  onProjectChange: (projectId: string) => void
  onCreateProject: () => void
  search: string
}

type EditableShot = Pick<
  ShotRecord,
  'title' | 'order' | 'description' | 'framing' | 'cameraMovement' | 'durationSeconds' | 'prompt'
>

const framings: ShotRecord['framing'][] = [
  'Extreme wide',
  'Wide',
  'Medium',
  'Close-up',
  'Extreme close-up',
]

const cameraMovements: ShotRecord['cameraMovement'][] = [
  'Static',
  'Pan',
  'Tilt',
  'Dolly',
  'Tracking',
  'Handheld',
]

export default function SceneStudio({
  projectId,
  projects,
  onProjectChange,
  onCreateProject,
  search,
}: SceneStudioProps) {
  const [scenes, setScenes] = useState<SceneRecord[]>([])
  const [scripts, setScripts] = useState<ScriptRecord[]>([])
  const [shots, setShots] = useState<ShotRecord[]>([])
  const [selectedSceneId, setSelectedSceneId] = useState('')
  const [sceneLoadError, setSceneLoadError] = useState('')
  const [scriptLoadError, setScriptLoadError] = useState('')
  const [shotLoadError, setShotLoadError] = useState('')
  const [error, setError] = useState('')
  const [loadedSceneProjectId, setLoadedSceneProjectId] = useState('')
  const [loadedScriptProjectId, setLoadedScriptProjectId] = useState('')
  const [loadedShotsSceneId, setLoadedShotsSceneId] = useState('')
  const [isSavingScene, setIsSavingScene] = useState(false)
  const [savingShotId, setSavingShotId] = useState('')
  const [isCreatingScene, setIsCreatingScene] = useState(false)
  const [isCreatingShot, setIsCreatingShot] = useState(false)
  const [isSceneDirty, setIsSceneDirty] = useState(false)
  const [dirtyShotIds, setDirtyShotIds] = useState<string[]>([])
  const [showCreateScene, setShowCreateScene] = useState(false)
  const [newSceneTitle, setNewSceneTitle] = useState('')
  const [newSceneSynopsis, setNewSceneSynopsis] = useState('')
  const [newSceneScriptId, setNewSceneScriptId] = useState('')

  const isLoadingScenes = Boolean(projectId && loadedSceneProjectId !== projectId)
  const isLoadingScripts = Boolean(projectId && loadedScriptProjectId !== projectId)
  const isLoadingShots = Boolean(selectedSceneId && loadedShotsSceneId !== selectedSceneId)
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId)

  useEffect(() => {
    if (!projectId) return

    let active = true
    listScenes(projectId)
      .then((records) => {
        if (!active) return
        setScenes(records)
        setSelectedSceneId((current) =>
          records.some((scene) => scene.id === current) ? current : records[0]?.id || '',
        )
        setLoadedSceneProjectId(projectId)
        setSceneLoadError('')
        setIsSceneDirty(false)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setLoadedSceneProjectId(projectId)
        setSceneLoadError(cause instanceof Error ? cause.message : 'Could not load scenes.')
      })

    return () => {
      active = false
    }
  }, [projectId])

  useEffect(() => {
    if (!projectId) return

    let active = true
    listScripts(projectId)
      .then((records) => {
        if (!active) return
        setScripts(records)
        setLoadedScriptProjectId(projectId)
        setScriptLoadError('')
      })
      .catch((cause: unknown) => {
        if (!active) return
        setLoadedScriptProjectId(projectId)
        setScriptLoadError(cause instanceof Error ? cause.message : 'Could not load project scripts.')
      })

    return () => {
      active = false
    }
  }, [projectId])

  useEffect(() => {
    if (!selectedSceneId) return

    let active = true
    listShots(selectedSceneId)
      .then((records) => {
        if (!active) return
        setShots(records)
        setLoadedShotsSceneId(selectedSceneId)
        setDirtyShotIds([])
        setShotLoadError('')
      })
      .catch((cause: unknown) => {
        if (!active) return
        setLoadedShotsSceneId(selectedSceneId)
        setShotLoadError(cause instanceof Error ? cause.message : 'Could not load shots.')
      })

    return () => {
      active = false
    }
  }, [selectedSceneId])

  const visibleScenes = scenes.filter((scene) =>
    scene.title.toLowerCase().includes(search.toLowerCase()),
  )
  const hasUnsavedChanges = isSceneDirty || dirtyShotIds.length > 0

  const confirmDiscardUnsaved = () => !hasUnsavedChanges ||
    window.confirm('Discard your unsaved scene or shot changes?')

  const createNewScene = async () => {
    if (!confirmDiscardUnsaved()) return
    if (!projectId) {
      setError('Create or select a project before adding scenes.')
      return
    }
    if (!newSceneTitle.trim()) {
      setError('Enter a scene title.')
      return
    }

    setIsCreatingScene(true)
    setError('')
    try {
      const sequence = Math.max(0, ...scenes.map((scene) => scene.sequence)) + 1
      const created = await createScene({
        title: newSceneTitle,
        sequence,
        synopsis: newSceneSynopsis,
        projectId,
        scriptId: newSceneScriptId || undefined,
      })
      const records = await listScenes(projectId)
      setScenes(records)
      setSelectedSceneId(created.id)
      setLoadedSceneProjectId(projectId)
      setNewSceneTitle('')
      setNewSceneSynopsis('')
      setNewSceneScriptId('')
      setShowCreateScene(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create scene.')
    } finally {
      setIsCreatingScene(false)
    }
  }

  const saveCurrentScene = async () => {
    if (!selectedScene) return
    if (!selectedScene.title.trim()) {
      setError('Enter a scene title before saving.')
      return
    }
    if (!Number.isInteger(selectedScene.sequence) || selectedScene.sequence < 1 || selectedScene.sequence > 999) {
      setError('Scene number must be between 1 and 999.')
      return
    }

    setIsSavingScene(true)
    setError('')
    try {
      await updateScene(selectedScene.id, {
        title: selectedScene.title,
        sequence: selectedScene.sequence,
        synopsis: selectedScene.synopsis,
        scriptId: selectedScene.scriptId,
      })
      setIsSceneDirty(false)
      setScenes(await listScenes(projectId))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save scene.')
    } finally {
      setIsSavingScene(false)
    }
  }

  const removeScene = async () => {
    if (!selectedScene || !window.confirm(`Delete "${selectedScene.title}" and all of its shots?`)) return

    setError('')
    try {
      await deleteScene(selectedScene.id)
      const records = await listScenes(projectId)
      setScenes(records)
      setSelectedSceneId(records[0]?.id || '')
      setLoadedSceneProjectId(projectId)
      setIsSceneDirty(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete scene.')
    }
  }

  const addShot = async () => {
    if (!selectedScene) return
    setIsCreatingShot(true)
    setError('')
    try {
      const order = Math.max(0, ...shots.map((shot) => shot.order)) + 1
      await createShot({
        sceneId: selectedScene.id,
        projectId,
        order,
      })
      setShots(await listShots(selectedScene.id))
      setLoadedShotsSceneId(selectedScene.id)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add shot.')
    } finally {
      setIsCreatingShot(false)
    }
  }

  const updateShotDraft = (id: string, patch: Partial<EditableShot>) => {
    setShots((current) => current.map((shot) => shot.id === id ? { ...shot, ...patch } : shot))
    setDirtyShotIds((current) => current.includes(id) ? current : [...current, id])
    setError('')
  }

  const saveShot = async (id: string) => {
    const shot = shots.find((item) => item.id === id)
    if (!shot) return
    if (!shot.title.trim()) {
      setError('Enter a shot title before saving.')
      return
    }
    if (!Number.isInteger(shot.order) || shot.order < 1 || shot.order > 999) {
      setError('Shot number must be between 1 and 999.')
      return
    }
    if (!Number.isFinite(shot.durationSeconds) || shot.durationSeconds < 1 || shot.durationSeconds > 120) {
      setError('Shot duration must be between 1 and 120 seconds.')
      return
    }

    setSavingShotId(id)
    setError('')
    try {
      await updateShot(id, {
        title: shot.title.trim(),
        order: shot.order,
        description: shot.description,
        framing: shot.framing,
        cameraMovement: shot.cameraMovement,
        durationSeconds: shot.durationSeconds,
        prompt: shot.prompt,
      })
      setDirtyShotIds((current) => current.filter((dirtyId) => dirtyId !== id))
      setShots(await listShots(selectedSceneId))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save shot.')
    } finally {
      setSavingShotId('')
    }
  }

  const removeShot = async (shot: ShotRecord) => {
    if (!window.confirm(`Delete "${shot.title}"?`)) return
    setError('')
    try {
      await deleteShot(shot.id)
      setShots(await listShots(selectedSceneId))
      setDirtyShotIds((current) => current.filter((id) => id !== shot.id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete shot.')
    }
  }

  const updateSceneDraft = (patch: Partial<Pick<SceneRecord, 'title' | 'sequence' | 'synopsis' | 'scriptId'>>) => {
    if (!selectedScene) return
    setScenes((current) => current.map((scene) =>
      scene.id === selectedScene.id ? { ...scene, ...patch } : scene,
    ))
    setIsSceneDirty(true)
    setError('')
  }

  return (
    <section className="scene-studio">
      <div className="scene-heading">
        <div>
          <p className="eyebrow">SHOT PLANNING</p>
          <h1>Scene Studio</h1>
          <p className="section-description">Break your story into scenes and production-ready cinematic shots.</p>
        </div>
        <div className="scene-heading-actions">
          <label className="project-select-label">
            Project
            <select
              value={projectId}
              onChange={(event) => {
                if (confirmDiscardUnsaved()) onProjectChange(event.target.value)
              }}
              disabled={projects.length === 0}
            >
              {projects.length === 0 ? <option value="">No projects yet</option> :
                projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}
            </select>
          </label>
          <button type="button" className="primary-button" onClick={() => {
            setError('')
            setShowCreateScene(true)
          }} disabled={!projectId}>
            <Plus size={16} /> New scene
          </button>
        </div>
      </div>

      {sceneLoadError && <div className="inline-error" role="alert">{sceneLoadError}</div>}
      {scriptLoadError && <div className="inline-error" role="alert">{scriptLoadError}</div>}
      {shotLoadError && <div className="inline-error" role="alert">{shotLoadError}</div>}
      {error && <div className="inline-error" role="alert">{error}</div>}

      {projects.length === 0 ? (
        <div className="character-empty">
          <div className="placeholder-icon"><Clapperboard size={24} /></div>
          <h2>Start with a project</h2>
          <p>Scenes are organized by production. Create a project to plan its shots.</p>
          <button type="button" className="primary-button" onClick={onCreateProject}>
            <Plus size={16} /> Create project
          </button>
        </div>
      ) : isLoadingScenes || isLoadingScripts ? (
        <div className="empty-state">Loading your production...</div>
      ) : (
        <div className="scene-layout">
          <aside className="scene-list-panel">
            <div className="scene-list-heading">
              <div>
                <strong>Scenes</strong>
                <span>{visibleScenes.length}</span>
              </div>
              <button type="button" onClick={() => setShowCreateScene(true)} aria-label="Create scene">
                <Plus size={16} />
              </button>
            </div>
            <div className="scene-list">
              {visibleScenes.map((scene) => (
                <button
                  type="button"
                  key={scene.id}
                  className={`scene-list-item ${scene.id === selectedSceneId ? 'selected' : ''}`}
                  onClick={() => {
                    if (!confirmDiscardUnsaved()) return
                    setSelectedSceneId(scene.id)
                    setIsSceneDirty(false)
                    setError('')
                  }}
                >
                  <span className="scene-number">{String(scene.sequence).padStart(2, '0')}</span>
                  <span className="scene-list-copy">
                    <strong>{scene.title}</strong>
                    <span>{scene.scriptTitle || 'Unlinked scene'}</span>
                  </span>
                </button>
              ))}
              {visibleScenes.length === 0 && (
                <div className="script-list-empty">
                  {search ? 'No matching scenes.' : 'No scenes yet. Create one to start planning shots.'}
                </div>
              )}
            </div>
          </aside>

          {selectedScene ? (
            <div className="scene-detail">
              <div className="scene-detail-toolbar">
                <span className="scene-context">
                  Scene {String(selectedScene.sequence).padStart(2, '0')} · {shots.length} shots
                </span>
                <div>
                  <button
                    type="button"
                    className="icon-button danger-button"
                    onClick={removeScene}
                    aria-label="Delete scene"
                    title="Delete scene and its shots"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button type="button" className="primary-button" onClick={saveCurrentScene} disabled={!isSceneDirty || isSavingScene}>
                    <Save size={14} /> {isSavingScene ? 'Saving...' : 'Save scene'}
                  </button>
                </div>
              </div>

              <div className="scene-fields">
                <label className="scene-title-field">
                  Scene title
                  <input
                    value={selectedScene.title}
                    onChange={(event) => updateSceneDraft({ title: event.target.value })}
                    maxLength={180}
                  />
                </label>
                <label className="scene-sequence-field">
                  No.
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={selectedScene.sequence}
                    onChange={(event) => updateSceneDraft({ sequence: Number(event.target.value) })}
                  />
                </label>
                <label className="scene-script-field">
                  Source script
                  <select
                    value={selectedScene.scriptId}
                    onChange={(event) => updateSceneDraft({ scriptId: event.target.value })}
                  >
                    <option value="">Not linked</option>
                    {scripts.map((script) => <option key={script.id} value={script.id}>{script.title}</option>)}
                  </select>
                </label>
                <label className="scene-synopsis-field">
                  Scene description
                  <textarea
                    value={selectedScene.synopsis}
                    onChange={(event) => updateSceneDraft({ synopsis: event.target.value })}
                    maxLength={5000}
                    rows={2}
                    placeholder="What happens in this scene? Include the dramatic beat, setting, and continuity notes."
                  />
                </label>
              </div>

              <div className="shot-breakdown-heading">
                <div>
                  <h2>Shot breakdown</h2>
                  <p>Define framing, camera movement, duration, and the generation prompt.</p>
                </div>
                <button type="button" className="filter-button" onClick={addShot} disabled={isCreatingShot || isLoadingShots}>
                  <Plus size={15} /> {isCreatingShot ? 'Adding...' : 'Add shot'}
                </button>
              </div>

              {isLoadingShots ? (
                <div className="empty-state">Loading shots...</div>
              ) : shots.length === 0 ? (
                <div className="shot-empty">
                  <div className="placeholder-icon"><Film size={22} /></div>
                  <strong>No shots in this scene</strong>
                  <span>Add the first shot to define the visual sequence.</span>
                </div>
              ) : (
                <div className="shot-list">
                  {shots.map((shot) => (
                    <article className="shot-card" key={shot.id}>
                      <div className="shot-card-heading">
                        <div>
                          <span className="shot-order">{String(shot.order).padStart(2, '0')}</span>
                          <input
                            aria-label="Shot title"
                            value={shot.title}
                            onChange={(event) => updateShotDraft(shot.id, { title: event.target.value })}
                            maxLength={180}
                          />
                        </div>
                        <div className="shot-card-actions">
                          <button
                            type="button"
                            className="icon-button danger-button"
                            onClick={() => removeShot(shot)}
                            aria-label={`Delete ${shot.title}`}
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="filter-button shot-save-button"
                            onClick={() => saveShot(shot.id)}
                            disabled={!dirtyShotIds.includes(shot.id) || savingShotId === shot.id}
                          >
                            <Save size={13} /> {savingShotId === shot.id ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                      <div className="shot-controls">
                        <label>
                          Framing
                          <select
                            value={shot.framing}
                            onChange={(event) => updateShotDraft(shot.id, { framing: event.target.value as ShotRecord['framing'] })}
                          >
                            {framings.map((framing) => <option key={framing}>{framing}</option>)}
                          </select>
                        </label>
                        <label>
                          Camera movement
                          <select
                            value={shot.cameraMovement}
                            onChange={(event) => updateShotDraft(shot.id, { cameraMovement: event.target.value as ShotRecord['cameraMovement'] })}
                          >
                            {cameraMovements.map((movement) => <option key={movement}>{movement}</option>)}
                          </select>
                        </label>
                        <label>
                          Duration (sec)
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={shot.durationSeconds}
                            onChange={(event) => updateShotDraft(shot.id, { durationSeconds: Number(event.target.value) })}
                          />
                        </label>
                      </div>
                      <label className="shot-description">
                        Action / visual description
                        <textarea
                          value={shot.description}
                          onChange={(event) => updateShotDraft(shot.id, { description: event.target.value })}
                          maxLength={5000}
                          rows={2}
                          placeholder="Describe the action, subject, lighting, and atmosphere."
                        />
                      </label>
                      <label className="shot-prompt">
                        Generation prompt
                        <textarea
                          value={shot.prompt}
                          onChange={(event) => updateShotDraft(shot.id, { prompt: event.target.value })}
                          maxLength={5000}
                          rows={2}
                          placeholder="A cinematic prompt for image/video generation."
                        />
                      </label>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="script-editor-empty scene-editor-empty">
              <div className="placeholder-icon"><Clapperboard size={24} /></div>
              <h2>{search ? 'No matching scenes' : 'Plan your first scene'}</h2>
              <p>{search ? 'Try another title or clear the search.' : 'Create a scene to connect story beats with production-ready shots.'}</p>
              {!search && (
                <button type="button" className="primary-button" onClick={() => setShowCreateScene(true)}>
                  <Plus size={16} /> New scene
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showCreateScene && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowCreateScene(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-scene-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">SHOT PLANNING</p>
                <h2 id="create-scene-title">Create scene</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowCreateScene(false)} aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <label>
              Scene title
              <input
                autoFocus
                value={newSceneTitle}
                onChange={(event) => setNewSceneTitle(event.target.value)}
                placeholder="e.g. The first encounter"
                maxLength={180}
              />
            </label>
            <label>
              Scene description
              <textarea
                value={newSceneSynopsis}
                onChange={(event) => setNewSceneSynopsis(event.target.value)}
                placeholder="Summarize what happens and where the scene takes place."
                maxLength={5000}
                rows={3}
              />
            </label>
            <label>
              Link a script <span>Optional</span>
              <select value={newSceneScriptId} onChange={(event) => setNewSceneScriptId(event.target.value)}>
                <option value="">Not linked</option>
                {scripts.map((script) => <option key={script.id} value={script.id}>{script.title}</option>)}
              </select>
            </label>
            {error && <div className="inline-error" role="alert">{error}</div>}
            <div className="modal-actions">
              <button type="button" className="filter-button" onClick={() => setShowCreateScene(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={createNewScene} disabled={isCreatingScene || !newSceneTitle.trim()}>
                {isCreatingScene ? 'Creating...' : 'Create scene'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
