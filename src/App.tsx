import { useEffect, useState } from 'react'
import {
  Aperture,
  AudioLines,
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Film,
  FolderKanban,
  Image,
  Layers3,
  MapPin,
  Plus,
  Search,
  Settings,
  Sparkles,
  Upload,
  Users,
  UserRound,
  WandSparkles,
  X,
} from 'lucide-react'
import './App.css'
import SceneStudio from './components/SceneStudio'
import {
  createCharacter as persistCharacter,
  createLocation as persistLocation,
  createProject as persistProject,
  createScript as persistScript,
  listCharacters,
  listLocations,
  listProjects,
  listScripts,
  updateScript,
  type CharacterRecord,
  type LocationRecord,
  type ProjectRecord,
  type ScriptRecord,
} from './services/studio'

type Project = {
  id: string
  title: string
  type: string
  updated: string
  progress: number
  color: string
  image: string
  status: 'In progress' | 'Draft' | 'Rendering' | 'Complete'
}

const navSections = [
  {
    label: 'Workspace',
    items: [
      { name: 'Dashboard', icon: FolderKanban },
      { name: 'Characters', icon: Users },
      { name: 'Locations', icon: MapPin },
    ],
  },
  {
    label: 'Production',
    items: [
      { name: 'Story & Script', icon: Clapperboard },
      { name: 'Scene Studio', icon: Aperture },
      { name: 'AI Generator', icon: WandSparkles },
      { name: 'Consistency', icon: Layers3 },
      { name: 'Audio Studio', icon: AudioLines },
      { name: 'Movie Editor', icon: Film },
    ],
  },
]

function getReferenceImageError(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return 'Choose a JPG, PNG, or WebP image.'
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'Reference images must be 10 MB or smaller.'
  }
  return ''
}

function App() {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [showCreate, setShowCreate] = useState(false)
  const [showCreateCharacter, setShowCreateCharacter] = useState(false)
  const [showCreateLocation, setShowCreateLocation] = useState(false)
  const [search, setSearch] = useState('')
  const [projectName, setProjectName] = useState('Untitled Project')
  const [productionType, setProductionType] = useState('Short film')
  const [projectList, setProjectList] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [characters, setCharacters] = useState<CharacterRecord[]>([])
  const [locations, setLocations] = useState<LocationRecord[]>([])
  const [scripts, setScripts] = useState<ScriptRecord[]>([])
  const [selectedScriptId, setSelectedScriptId] = useState('')
  const [projectError, setProjectError] = useState('')
  const [characterError, setCharacterError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [scriptError, setScriptError] = useState('')
  const [characterLoadError, setCharacterLoadError] = useState<{ projectId: string; message: string } | null>(null)
  const [locationLoadError, setLocationLoadError] = useState<{ projectId: string; message: string } | null>(null)
  const [scriptLoadError, setScriptLoadError] = useState<{ projectId: string; message: string } | null>(null)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [loadedCharacterProjectId, setLoadedCharacterProjectId] = useState('')
  const [loadedLocationProjectId, setLoadedLocationProjectId] = useState('')
  const [loadedScriptProjectId, setLoadedScriptProjectId] = useState('')
  const [isSavingCharacter, setIsSavingCharacter] = useState(false)
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [isSavingScript, setIsSavingScript] = useState(false)
  const [isScriptDirty, setIsScriptDirty] = useState(false)
  const [characterName, setCharacterName] = useState('')
  const [characterRole, setCharacterRole] = useState('')
  const [characterDescription, setCharacterDescription] = useState('')
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [locationName, setLocationName] = useState('')
  const [locationDescription, setLocationDescription] = useState('')
  const [locationReferenceImage, setLocationReferenceImage] = useState<File | null>(null)

  useEffect(() => {
    let active = true
    listProjects()
      .then((records: ProjectRecord[]) => {
        if (!active) return
        setProjectList(records.map((record) => ({
          id: record.id,
          title: record.title,
          type: record.productionType,
          updated: 'PocketBase',
          progress: record.progress,
          color: record.status === 'Rendering' ? '#6c7d91' : '#8f7aea',
          image: record.coverStyle || 'ember',
          status: record.status,
        })))
        if (records.length > 0) {
          setSelectedProjectId((current) => current || records[0].id)
        }
      })
      .catch((error: unknown) => {
        if (!active) return
        setProjectError(error instanceof Error ? error.message : 'Could not load projects.')
      })
      .finally(() => {
        if (active) setIsLoadingProjects(false)
      })

    return () => {
      active = false
    }
  }, [])

  const isLoadingCharacters = Boolean(selectedProjectId && loadedCharacterProjectId !== selectedProjectId)
  const isLoadingLocations = Boolean(selectedProjectId && loadedLocationProjectId !== selectedProjectId)
  const isLoadingScripts = Boolean(selectedProjectId && loadedScriptProjectId !== selectedProjectId)

  useEffect(() => {
    if (!selectedProjectId) return

    let active = true
    listCharacters(selectedProjectId)
      .then((records) => {
        if (active) {
          setCharacters(records)
          setLoadedCharacterProjectId(selectedProjectId)
          setCharacterLoadError(null)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadedCharacterProjectId(selectedProjectId)
          setCharacterLoadError({
            projectId: selectedProjectId,
            message: error instanceof Error ? error.message : 'Could not load characters.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [selectedProjectId])

  useEffect(() => {
    if (!selectedProjectId) return

    let active = true
    listScripts(selectedProjectId)
      .then((records) => {
        if (active) {
          setScripts(records)
          setSelectedScriptId((current) =>
            records.some((script) => script.id === current) ? current : records[0]?.id || '',
          )
          setLoadedScriptProjectId(selectedProjectId)
          setScriptLoadError(null)
          setIsScriptDirty(false)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadedScriptProjectId(selectedProjectId)
          setScriptLoadError({
            projectId: selectedProjectId,
            message: error instanceof Error ? error.message : 'Could not load scripts.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [selectedProjectId])

  const selectedScript = scripts.find((script) => script.id === selectedScriptId)

  useEffect(() => {
    if (!selectedProjectId) return

    let active = true
    listLocations(selectedProjectId)
      .then((records) => {
        if (active) {
          setLocations(records)
          setLoadedLocationProjectId(selectedProjectId)
          setLocationLoadError(null)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadedLocationProjectId(selectedProjectId)
          setLocationLoadError({
            projectId: selectedProjectId,
            message: error instanceof Error ? error.message : 'Could not load locations.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [selectedProjectId])

  const visibleProjects = projectList.filter((project) =>
    project.title.toLowerCase().includes(search.toLowerCase()),
  )

  const createProject = async () => {
    try {
      await persistProject({ title: projectName.trim() || 'Untitled Project', productionType })
      const records = await listProjects()
      setProjectList(records.map((record) => ({
        id: record.id,
        title: record.title,
        type: record.productionType,
        updated: 'Just now',
        progress: record.progress,
        color: '#8f7aea',
        image: record.coverStyle || 'ember',
        status: record.status,
      })))
      if (records.length > 0) {
        setSelectedProjectId((current) => current || records[0].id)
      }
      setProjectError('')
      setShowCreate(false)
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : 'Could not create project.')
    }
  }

  const createCharacter = async () => {
    if (!selectedProjectId) {
      setCharacterError('Create or select a project before adding characters.')
      return
    }
    if (!characterName.trim()) {
      setCharacterError('Enter a character name.')
      return
    }

    setIsSavingCharacter(true)
    setCharacterError('')
    try {
      await persistCharacter({
        name: characterName,
        role: characterRole,
        description: characterDescription,
        projectId: selectedProjectId,
        referenceImage: referenceImage || undefined,
      })
      const records = await listCharacters(selectedProjectId)
      setCharacters(records)
      setLoadedCharacterProjectId(selectedProjectId)
      setCharacterName('')
      setCharacterRole('')
      setCharacterDescription('')
      setReferenceImage(null)
      setShowCreateCharacter(false)
    } catch (error) {
      setCharacterError(error instanceof Error ? error.message : 'Could not create character.')
    } finally {
      setIsSavingCharacter(false)
    }
  }

  const createLocation = async () => {
    if (!selectedProjectId) {
      setLocationError('Create or select a project before adding locations.')
      return
    }
    if (!locationName.trim()) {
      setLocationError('Enter a location name.')
      return
    }

    setIsSavingLocation(true)
    setLocationError('')
    try {
      await persistLocation({
        name: locationName,
        description: locationDescription,
        projectId: selectedProjectId,
        referenceImage: locationReferenceImage || undefined,
      })
      const records = await listLocations(selectedProjectId)
      setLocations(records)
      setLoadedLocationProjectId(selectedProjectId)
      setLocationName('')
      setLocationDescription('')
      setLocationReferenceImage(null)
      setShowCreateLocation(false)
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Could not create location.')
    } finally {
      setIsSavingLocation(false)
    }
  }

  const createScript = async () => {
    if (!selectedProjectId) {
      setScriptError('Create or select a project before adding scripts.')
      return
    }

    setIsSavingScript(true)
    setScriptError('')
    try {
      const created = await persistScript(selectedProjectId)
      const records = await listScripts(selectedProjectId)
      setScripts(records)
      setSelectedScriptId(created.id)
      setLoadedScriptProjectId(selectedProjectId)
      setIsScriptDirty(false)
    } catch (error) {
      setScriptError(error instanceof Error ? error.message : 'Could not create script.')
    } finally {
      setIsSavingScript(false)
    }
  }

  const saveScript = async () => {
    if (!selectedScript) return
    if (!selectedScript.title.trim()) {
      setScriptError('Enter a title before saving.')
      return
    }

    setIsSavingScript(true)
    setScriptError('')
    try {
      await updateScript(selectedScript.id, {
        title: selectedScript.title.trim(),
        documentType: selectedScript.documentType,
        content: selectedScript.content,
      })
      setIsScriptDirty(false)
    } catch (error) {
      setScriptError(error instanceof Error ? error.message : 'Could not save script.')
    } finally {
      setIsSavingScript(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={17} /></div>
          <span>CINEMA<span>FLOW</span></span>
        </div>

        <nav>
          {navSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <div className="nav-label">{section.label}</div>
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    type="button"
                    className={`nav-item ${activeNav === item.name ? 'active' : ''}`}
                    onClick={() => setActiveNav(item.name)}
                    key={item.name}
                  >
                    <Icon size={17} />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="nav-item" onClick={() => setActiveNav('Team Workspace')}>
            <Users size={17} />
            <span>Team Workspace</span>
          </button>
          <button type="button" className="nav-item" onClick={() => setActiveNav('Settings')}>
            <Settings size={17} />
            <span>Settings</span>
          </button>
          <div className="user-card">
            <div className="avatar">AM</div>
            <div>
              <strong>Alex Morgan</strong>
              <span>Creator</span>
            </div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="project-switcher">
            <span>Studio</span>
            <ChevronRight size={14} />
            <strong>{activeNav}</strong>
          </div>
          <div className="top-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={activeNav === 'Characters' ? 'Search characters' : activeNav === 'Locations' ? 'Search locations' : activeNav === 'Story & Script' ? 'Search scripts' : activeNav === 'Scene Studio' ? 'Search scenes' : 'Search projects'}
                aria-label={activeNav === 'Characters' ? 'Search characters' : activeNav === 'Locations' ? 'Search locations' : activeNav === 'Story & Script' ? 'Search scripts' : activeNav === 'Scene Studio' ? 'Search scenes' : 'Search projects'}
              />
            </div>
            <button type="button" className="icon-button" aria-label="Notifications">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>
            {activeNav === 'Characters' ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setCharacterError('')
                  setShowCreateCharacter(true)
                }}
              >
                <Plus size={17} />
                Add character
              </button>
            ) : activeNav === 'Locations' ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setLocationError('')
                  setShowCreateLocation(true)
                }}
              >
                <Plus size={17} />
                Add location
              </button>
            ) : activeNav === 'Story & Script' ? (
              <button
                type="button"
                className="primary-button"
                onClick={createScript}
                disabled={isSavingScript}
              >
                <Plus size={17} />
                New script
              </button>
            ) : activeNav === 'Scene Studio' ? null : (
              <button type="button" className="primary-button" onClick={() => setShowCreate(true)}>
                <Plus size={17} />
                New project
              </button>
            )}
          </div>
        </header>

        <div className="content">
          {projectError && (
            <div className="inline-error" role="alert">
              <span>{projectError}</span>
              <button type="button" onClick={() => setShowCreate(true)}>Create a project</button>
            </div>
          )}
          {activeNav === 'Dashboard' ? (
            <>
              <section className="welcome">
                <div>
                  <p className="eyebrow">PROJECT OVERVIEW</p>
                  <h1>Good morning, Alex</h1>
                </div>
                <div className="usage">
                  <div>
                    <span>GPU usage</span>
                    <strong>2.4h</strong>
                  </div>
                  <div className="usage-track"><span /></div>
                </div>
              </section>

              <section className="project-toolbar">
                <div>
                  <h2>My projects</h2>
                  <span>{visibleProjects.length} productions</span>
                </div>
                <button type="button" className="filter-button">
                  Recent
                  <ChevronDown size={15} />
                </button>
              </section>

              <section className="project-grid">
                {isLoadingProjects ? (
                  <div className="empty-state">Loading projects...</div>
                ) : visibleProjects.map((project) => (
                  <article className="project-card" key={project.id}>
                    <div className={`project-cover ${project.image}`}>
                      <div className="cover-shade" />
                      <span className={`status status-${project.status.toLowerCase().replace(' ', '-')}`}>
                        {project.status}
                      </span>
                      <button type="button" className="open-button" aria-label={`Open ${project.title}`}>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    <div className="project-info">
                      <div>
                        <h3>{project.title}</h3>
                        <p>{project.type}</p>
                      </div>
                      <span className="updated">{project.updated}</span>
                      <div className="progress-row">
                        <div className="progress-track">
                          <span style={{ width: `${project.progress}%`, background: project.color }} />
                        </div>
                        <strong>{project.progress}%</strong>
                      </div>
                    </div>
                  </article>
                ))}
                {!isLoadingProjects && visibleProjects.length === 0 && (
                  <div className="empty-state">
                    {projectError ? 'Projects could not be loaded.' : 'No projects match your search.'}
                  </div>
                )}
              </section>

              <section className="activity">
                <h2>Recent activity</h2>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon"><Image size={16} /></div>
                    <div><strong>Scene 08 generated</strong><span>Neon District · 12 minutes ago</span></div>
                    <span className="activity-badge">Image</span>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon violet"><WandSparkles size={16} /></div>
                    <div><strong>Character reference updated</strong><span>Elara Voss · Yesterday</span></div>
                    <span className="activity-badge">Character</span>
                  </div>
                </div>
              </section>
            </>
          ) : activeNav === 'Characters' ? (
            <section className="character-studio">
              <div className="character-heading">
                <div>
                  <p className="eyebrow">CAST & REFERENCES</p>
                  <h1>Character Studio</h1>
                  <p className="section-description">Build a visual library for consistent characters across your film.</p>
                </div>
                <label className="project-select-label">
                  Project
                  <select
                    value={selectedProjectId}
                    onChange={(event) => setSelectedProjectId(event.target.value)}
                    disabled={projectList.length === 0}
                  >
                    {projectList.length === 0 ? <option value="">No projects yet</option> :
                      projectList.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}
                  </select>
                </label>
              </div>

              {characterLoadError?.projectId === selectedProjectId && (
                <div className="inline-error" role="alert">{characterLoadError.message}</div>
              )}
              {projectList.length === 0 ? (
                <div className="character-empty">
                  <div className="placeholder-icon"><Users size={24} /></div>
                  <h2>Start with a project</h2>
                  <p>Characters are organized by production. Create a project to build its cast.</p>
                  <button type="button" className="primary-button" onClick={() => setShowCreate(true)}>
                    <Plus size={16} /> Create project
                  </button>
                </div>
              ) : isLoadingCharacters ? (
                <div className="empty-state">Loading characters...</div>
              ) : characters.filter((character) => character.name.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                <div className="character-empty">
                  <div className="placeholder-icon"><UserRound size={24} /></div>
                  <h2>{search ? 'No matching characters' : 'No characters yet'}</h2>
                  <p>{search ? 'Try another name or clear the search.' : 'Add a character and attach a reference image to guide visual consistency.'}</p>
                  {!search && (
                    <button type="button" className="primary-button" onClick={() => setShowCreateCharacter(true)}>
                      <Plus size={16} /> Add first character
                    </button>
                  )}
                </div>
              ) : (
                <div className="character-grid">
                  {characters
                    .filter((character) => character.name.toLowerCase().includes(search.toLowerCase()))
                    .map((character) => (
                      <article className="character-card" key={character.id}>
                        <div className="character-portrait">
                          {character.referenceUrl ? (
                            <img src={character.referenceUrl} alt={`${character.name} reference`} />
                          ) : (
                            <div className="character-initials">
                              {character.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                            </div>
                          )}
                          <span className="reference-count">
                            <Image size={13} /> {character.referenceUrl ? '1 reference' : 'No reference'}
                          </span>
                        </div>
                        <div className="character-card-info">
                          <div>
                            <h2>{character.name}</h2>
                            <span>{character.role || 'Character'}</span>
                          </div>
                          {character.description && <p>{character.description}</p>}
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </section>
          ) : activeNav === 'Story & Script' ? (
            <section className="script-studio">
              <div className="character-heading">
                <div>
                  <p className="eyebrow">WRITING ROOM</p>
                  <h1>Story & Script</h1>
                  <p className="section-description">Develop screenplays, story outlines, and dialogue in one project workspace.</p>
                </div>
                <label className="project-select-label">
                  Project
                  <select
                    value={selectedProjectId}
                    onChange={(event) => setSelectedProjectId(event.target.value)}
                    disabled={projectList.length === 0}
                  >
                    {projectList.length === 0 ? <option value="">No projects yet</option> :
                      projectList.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}
                  </select>
                </label>
              </div>

              {scriptLoadError?.projectId === selectedProjectId && (
                <div className="inline-error" role="alert">{scriptLoadError.message}</div>
              )}
              {scriptError && <div className="inline-error" role="alert">{scriptError}</div>}
              {projectList.length === 0 ? (
                <div className="character-empty">
                  <div className="placeholder-icon"><Clapperboard size={24} /></div>
                  <h2>Start with a project</h2>
                  <p>Scripts are organized by production. Create a project to start writing.</p>
                  <button type="button" className="primary-button" onClick={() => setShowCreate(true)}>
                    <Plus size={16} /> Create project
                  </button>
                </div>
              ) : isLoadingScripts ? (
                <div className="empty-state">Loading scripts...</div>
              ) : (
                <div className="script-layout">
                  <aside className="script-list-panel">
                    <div className="script-list-heading">
                      <div>
                        <strong>Documents</strong>
                        <span>{scripts.filter((script) => script.title.toLowerCase().includes(search.toLowerCase())).length}</span>
                      </div>
                      <button type="button" onClick={createScript} disabled={isSavingScript} aria-label="Create script">
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="script-list">
                      {scripts
                        .filter((script) => script.title.toLowerCase().includes(search.toLowerCase()))
                        .map((script) => (
                          <button
                            type="button"
                            key={script.id}
                            className={`script-list-item ${script.id === selectedScriptId ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedScriptId(script.id)
                              setIsScriptDirty(false)
                              setScriptError('')
                            }}
                          >
                            <span className="script-doc-icon"><Clapperboard size={15} /></span>
                            <span className="script-list-copy">
                              <strong>{script.title || 'Untitled script'}</strong>
                              <span>{script.documentType}</span>
                            </span>
                          </button>
                        ))}
                      {scripts.filter((script) => script.title.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                        <div className="script-list-empty">
                          {search ? 'No matching scripts.' : 'No documents yet. Create a script to get started.'}
                        </div>
                      )}
                    </div>
                  </aside>

                  {selectedScript ? (
                    <div className="script-editor">
                      <div className="script-editor-toolbar">
                        <select
                          aria-label="Document type"
                          value={selectedScript.documentType}
                          onChange={(event) => {
                            const documentType = event.target.value as ScriptRecord['documentType']
                            setScripts((current) => current.map((script) =>
                              script.id === selectedScript.id ? { ...script, documentType } : script,
                            ))
                            setIsScriptDirty(true)
                            setScriptError('')
                          }}
                        >
                          <option>Screenplay</option>
                          <option>Outline</option>
                          <option>Notes</option>
                        </select>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={saveScript}
                          disabled={isSavingScript || !isScriptDirty}
                        >
                          {isSavingScript ? 'Saving...' : isScriptDirty ? 'Save changes' : 'Saved'}
                        </button>
                      </div>
                      <input
                        className="script-title-input"
                        aria-label="Script title"
                        value={selectedScript.title}
                        onChange={(event) => {
                          const title = event.target.value
                          setScripts((current) => current.map((script) =>
                            script.id === selectedScript.id ? { ...script, title } : script,
                          ))
                          setIsScriptDirty(true)
                          setScriptError('')
                        }}
                        maxLength={180}
                        placeholder="Untitled script"
                      />
                      <textarea
                        className="script-content-input"
                        aria-label="Script content"
                        value={selectedScript.content}
                        onChange={(event) => {
                          const content = event.target.value
                          setScripts((current) => current.map((script) =>
                            script.id === selectedScript.id ? { ...script, content } : script,
                          ))
                          setIsScriptDirty(true)
                          setScriptError('')
                        }}
                        maxLength={100000}
                        placeholder={'FADE IN:\n\nEXT. OLD TOWN SQUARE - NIGHT\n\nRain sweeps across the empty square. A distant bell rings.\n\nELARA\nWe have one chance. We take it before sunrise.'}
                        spellCheck={false}
                      />
                      <div className="script-editor-footer">
                        <span>{selectedScript.content.trim() ? selectedScript.content.trim().split(/\s+/).length : 0} words</span>
                        <span>Saved to this project</span>
                      </div>
                    </div>
                  ) : (
                    <div className="script-editor-empty">
                      <div className="placeholder-icon"><Clapperboard size={24} /></div>
                      <h2>{search ? 'No matching scripts' : 'Your writing space'}</h2>
                      <p>{search ? 'Try another title or clear the search.' : 'Create a document to start shaping your story.'}</p>
                      {!search && (
                        <button type="button" className="primary-button" onClick={createScript} disabled={isSavingScript}>
                          <Plus size={16} /> New script
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          ) : activeNav === 'Scene Studio' ? (
            <SceneStudio
              projectId={selectedProjectId}
              projects={projectList}
              onProjectChange={setSelectedProjectId}
              onCreateProject={() => setShowCreate(true)}
              search={search}
            />
          ) : activeNav === 'Locations' ? (
            <section className="location-studio">
              <div className="character-heading">
                <div>
                  <p className="eyebrow">WORLD & ENVIRONMENTS</p>
                  <h1>Location Studio</h1>
                  <p className="section-description">Collect places, architecture, and visual references for each production.</p>
                </div>
                <label className="project-select-label">
                  Project
                  <select
                    value={selectedProjectId}
                    onChange={(event) => setSelectedProjectId(event.target.value)}
                    disabled={projectList.length === 0}
                  >
                    {projectList.length === 0 ? <option value="">No projects yet</option> :
                      projectList.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}
                  </select>
                </label>
              </div>

              {locationLoadError?.projectId === selectedProjectId && (
                <div className="inline-error" role="alert">{locationLoadError.message}</div>
              )}
              {projectList.length === 0 ? (
                <div className="character-empty">
                  <div className="placeholder-icon"><MapPin size={24} /></div>
                  <h2>Start with a project</h2>
                  <p>Locations are organized by production. Create a project to build its world.</p>
                  <button type="button" className="primary-button" onClick={() => setShowCreate(true)}>
                    <Plus size={16} /> Create project
                  </button>
                </div>
              ) : isLoadingLocations ? (
                <div className="empty-state">Loading locations...</div>
              ) : locations.filter((location) => location.name.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                <div className="character-empty">
                  <div className="placeholder-icon"><Building2 size={24} /></div>
                  <h2>{search ? 'No matching locations' : 'No locations yet'}</h2>
                  <p>{search ? 'Try another name or clear the search.' : 'Add a location and attach a reference image to guide the look of your scenes.'}</p>
                  {!search && (
                    <button type="button" className="primary-button" onClick={() => setShowCreateLocation(true)}>
                      <Plus size={16} /> Add first location
                    </button>
                  )}
                </div>
              ) : (
                <div className="location-grid">
                  {locations
                    .filter((location) => location.name.toLowerCase().includes(search.toLowerCase()))
                    .map((location) => (
                      <article className="location-card" key={location.id}>
                        <div className="location-cover">
                          {location.referenceUrl ? (
                            <img src={location.referenceUrl} alt={`${location.name} reference`} />
                          ) : (
                            <div className="location-art">
                              <MapPin size={30} />
                            </div>
                          )}
                          <span className="reference-count">
                            <Image size={13} /> {location.referenceUrl ? '1 reference' : 'No reference'}
                          </span>
                        </div>
                        <div className="location-card-info">
                          <h2>{location.name}</h2>
                          <p>{location.description || 'No environment notes yet.'}</p>
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </section>
          ) : (
            <section className="module-placeholder">
              <div className="placeholder-icon">
                {activeNav === 'Characters' ? <Users /> :
                  activeNav === 'Locations' ? <MapPin /> :
                    activeNav === 'AI Generator' ? <WandSparkles /> : <Clapperboard />}
              </div>
              <p className="eyebrow">MODULE</p>
              <h1>{activeNav}</h1>
              <p>This workspace is ready for the next production workflow.</p>
              <button type="button" className="primary-button" onClick={() => setActiveNav('Dashboard')}>
                Return to dashboard
              </button>
            </section>
          )}
        </div>
      </main>

      {showCreate && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowCreate(false)}>
          <div className="modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">NEW PRODUCTION</p>
                <h2>Create project</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowCreate(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <label>
              Project name
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />
            </label>
            <label>
              Production type
              <select value={productionType} onChange={(event) => setProductionType(event.target.value)}>
                <option>Short film</option>
                <option>Feature film</option>
                <option>Music video</option>
                <option>Commercial</option>
              </select>
            </label>
            {projectError && <div className="inline-error" role="alert">{projectError}</div>}
            <div className="modal-actions">
              <button type="button" className="filter-button" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={createProject}>Create project</button>
            </div>
          </div>
        </div>
      )}
      {showCreateCharacter && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowCreateCharacter(false)}>
          <div className="modal character-modal" role="dialog" aria-modal="true" aria-labelledby="character-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">CAST & REFERENCES</p>
                <h2 id="character-modal-title">Add character</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowCreateCharacter(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <label>
              Character name
              <input
                autoFocus
                value={characterName}
                onChange={(event) => setCharacterName(event.target.value)}
                placeholder="e.g. Elara Voss"
                maxLength={120}
              />
            </label>
            <label>
              Role
              <input
                value={characterRole}
                onChange={(event) => setCharacterRole(event.target.value)}
                placeholder="e.g. Lead, supporting character"
                maxLength={120}
              />
            </label>
            <label>
              Description
              <textarea
                value={characterDescription}
                onChange={(event) => setCharacterDescription(event.target.value)}
                placeholder="Appearance, personality, costume, or continuity notes"
                maxLength={2000}
                rows={3}
              />
            </label>
            <label className="upload-label">
              Reference image <span>Optional · JPG, PNG or WebP · Max 10 MB</span>
              <span className="upload-control">
                <Upload size={17} />
                <span>{referenceImage ? referenceImage.name : 'Choose a reference image'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    const validationError = getReferenceImageError(file)
                    if (validationError) {
                      setCharacterError(validationError)
                      event.target.value = ''
                      return
                    }
                    setCharacterError('')
                    setReferenceImage(file)
                  }}
                />
              </span>
            </label>
            {characterError && <div className="inline-error" role="alert">{characterError}</div>}
            <div className="modal-actions">
              <button type="button" className="filter-button" onClick={() => setShowCreateCharacter(false)}>Cancel</button>
              <button
                type="button"
                className="primary-button"
                onClick={createCharacter}
                disabled={isSavingCharacter || !characterName.trim()}
              >
                {isSavingCharacter ? 'Saving...' : 'Save character'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showCreateLocation && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowCreateLocation(false)}>
          <div className="modal character-modal" role="dialog" aria-modal="true" aria-labelledby="location-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">WORLD & ENVIRONMENTS</p>
                <h2 id="location-modal-title">Add location</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowCreateLocation(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <label>
              Location name
              <input
                autoFocus
                value={locationName}
                onChange={(event) => setLocationName(event.target.value)}
                placeholder="e.g. Old town square"
                maxLength={120}
              />
            </label>
            <label>
              Environment notes
              <textarea
                value={locationDescription}
                onChange={(event) => setLocationDescription(event.target.value)}
                placeholder="Architecture, time of day, weather, palette, and continuity details"
                maxLength={2000}
                rows={4}
              />
            </label>
            <label className="upload-label">
              Reference image <span>Optional · JPG, PNG or WebP · Max 10 MB</span>
              <span className="upload-control">
                <Upload size={17} />
                <span>{locationReferenceImage ? locationReferenceImage.name : 'Choose a location reference'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    const validationError = getReferenceImageError(file)
                    if (validationError) {
                      setLocationError(validationError)
                      event.target.value = ''
                      return
                    }
                    setLocationError('')
                    setLocationReferenceImage(file)
                  }}
                />
              </span>
            </label>
            {locationError && <div className="inline-error" role="alert">{locationError}</div>}
            <div className="modal-actions">
              <button type="button" className="filter-button" onClick={() => setShowCreateLocation(false)}>Cancel</button>
              <button
                type="button"
                className="primary-button"
                onClick={createLocation}
                disabled={isSavingLocation || !locationName.trim()}
              >
                {isSavingLocation ? 'Saving...' : 'Save location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
