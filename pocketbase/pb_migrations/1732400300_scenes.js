migrate((app) => {
  const users = app.findCollectionByNameOrId('_pb_users_auth_')
  const projects = app.findCollectionByNameOrId('projects')
  const scripts = app.findCollectionByNameOrId('scripts')

  const scenes = new Collection({
    name: 'scenes',
    type: 'base',
    fields: [
      { name: 'title', type: 'text', required: true, min: 1, max: 180 },
      { name: 'sequence', type: 'number', required: true, min: 1, max: 999 },
      { name: 'synopsis', type: 'text', max: 5000 },
      { name: 'project', type: 'relation', required: true, collectionId: projects.id, maxSelect: 1, cascadeDelete: true },
      { name: 'script', type: 'relation', collectionId: scripts.id, maxSelect: 1, cascadeDelete: false },
      { name: 'owner', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: false },
    ],
    listRule: 'owner = @request.auth.id',
    viewRule: 'owner = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: 'owner = @request.auth.id',
    deleteRule: 'owner = @request.auth.id',
  })
  app.save(scenes)

  const shots = new Collection({
    name: 'shots',
    type: 'base',
    fields: [
      { name: 'title', type: 'text', required: true, min: 1, max: 180 },
      { name: 'order', type: 'number', required: true, min: 1, max: 999 },
      { name: 'description', type: 'text', max: 5000 },
      { name: 'framing', type: 'select', values: ['Extreme wide', 'Wide', 'Medium', 'Close-up', 'Extreme close-up'], maxSelect: 1 },
      { name: 'cameraMovement', type: 'select', values: ['Static', 'Pan', 'Tilt', 'Dolly', 'Tracking', 'Handheld'], maxSelect: 1 },
      { name: 'durationSeconds', type: 'number', min: 1, max: 120 },
      { name: 'prompt', type: 'text', max: 5000 },
      { name: 'scene', type: 'relation', required: true, collectionId: scenes.id, maxSelect: 1, cascadeDelete: true },
      { name: 'project', type: 'relation', required: true, collectionId: projects.id, maxSelect: 1, cascadeDelete: true },
      { name: 'owner', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: false },
    ],
    listRule: 'owner = @request.auth.id',
    viewRule: 'owner = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: 'owner = @request.auth.id',
    deleteRule: 'owner = @request.auth.id',
  })
  app.save(shots)
}, (app) => {
  for (const name of ['shots', 'scenes']) {
    try {
      app.delete(app.findCollectionByNameOrId(name))
    } catch {}
  }
})
