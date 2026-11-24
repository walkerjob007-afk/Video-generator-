import { useEffect, useState } from 'react'
import {
  Aperture,
  AudioLines,
  Bell,
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
  Users,
  WandSparkles,
  X,
} from 'lucide-react'
import './App.css'
import { createProject as persistProject, listProjects, type ProjectRecord } from './services/studio'

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

function App() {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [projectName, setProjectName] = useState('Untitled Project')
  const [productionType, setProductionType] = useState('Short film')
  const [projectList, setProjectList] = useState<Project[]>([])

  useEffect(() => {
    listProjects()
      .then((records: ProjectRecord[]) => {
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
      })
      .catch(() => {
        setProjectList([])
      })
  }, [])

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
    } catch {
      // Keep the dialog open so the connection or validation issue remains visible.
    }
    setShowCreate(false)
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
                placeholder="Search projects"
                aria-label="Search projects"
              />
            </div>
            <button type="button" className="icon-button" aria-label="Notifications">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>
            <button type="button" className="primary-button" onClick={() => setShowCreate(true)}>
              <Plus size={17} />
              New project
            </button>
          </div>
        </header>

        <div className="content">
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
                {visibleProjects.map((project) => (
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
            <div className="modal-actions">
              <button type="button" className="filter-button" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={createProject}>Create project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
