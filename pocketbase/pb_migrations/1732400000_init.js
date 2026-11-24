migrate((app) => {
  const users = app.findCollectionByNameOrId('_pb_users_auth_')

  const teams = new Collection({
    name: 'teams',
    type: 'base',
    fields: [
      { name: 'name', type: 'text', required: true, min: 1, max: 120 },
      { name: 'owner', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: false },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: 'owner = @request.auth.id',
    deleteRule: 'owner = @request.auth.id',
  })
  app.save(teams)

  const projects = new Collection({
    name: 'projects',
    type: 'base',
    fields: [
      { name: 'title', type: 'text', required: true, min: 1, max: 180 },
      { name: 'productionType', type: 'text', required: true, max: 80 },
      { name: 'status', type: 'select', required: true, values: ['Draft', 'In progress', 'Rendering', 'Complete'], maxSelect: 1 },
      { name: 'progress', type: 'number', min: 0, max: 100 },
      { name: 'coverStyle', type: 'text', max: 40 },
      { name: 'owner', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: false },
      { name: 'team', type: 'relation', collectionId: teams.id, maxSelect: 1, cascadeDelete: false },
    ],
    listRule: 'owner = @request.auth.id',
    viewRule: 'owner = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: 'owner = @request.auth.id',
    deleteRule: 'owner = @request.auth.id',
  })
  app.save(projects)

  const characters = new Collection({
    name: 'characters',
    type: 'base',
    fields: [
      { name: 'name', type: 'text', required: true, min: 1, max: 120 },
      { name: 'role', type: 'text', max: 120 },
      { name: 'description', type: 'text', max: 2000 },
      { name: 'referenceImage', type: 'file', maxSelect: 10, maxSize: 10485760, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
      { name: 'project', type: 'relation', required: true, collectionId: projects.id, maxSelect: 1, cascadeDelete: true },
      { name: 'owner', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: false },
    ],
    listRule: 'owner = @request.auth.id',
    viewRule: 'owner = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: 'owner = @request.auth.id',
    deleteRule: 'owner = @request.auth.id',
  })
  app.save(characters)

  const locations = new Collection({
    name: 'locations',
    type: 'base',
    fields: [
      { name: 'name', type: 'text', required: true, min: 1, max: 120 },
      { name: 'description', type: 'text', max: 2000 },
      { name: 'referenceImage', type: 'file', maxSelect: 10, maxSize: 10485760, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
      { name: 'project', type: 'relation', required: true, collectionId: projects.id, maxSelect: 1, cascadeDelete: true },
      { name: 'owner', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: false },
    ],
    listRule: 'owner = @request.auth.id',
    viewRule: 'owner = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: 'owner = @request.auth.id',
    deleteRule: 'owner = @request.auth.id',
  })
  app.save(locations)
}, (app) => {
  for (const name of ['locations', 'characters', 'projects', 'teams']) {
    try {
      app.delete(app.findCollectionByNameOrId(name))
    } catch {}
  }
})
