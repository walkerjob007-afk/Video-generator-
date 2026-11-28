migrate((app) => {
  const users = app.findCollectionByNameOrId('_pb_users_auth_')
  const projects = app.findCollectionByNameOrId('projects')
  const scripts = new Collection({
    name: 'scripts',
    type: 'base',
    fields: [
      { name: 'title', type: 'text', required: true, min: 1, max: 180 },
      { name: 'documentType', type: 'select', required: true, values: ['Screenplay', 'Outline', 'Notes'], maxSelect: 1 },
      { name: 'content', type: 'text', max: 100000 },
      { name: 'project', type: 'relation', required: true, collectionId: projects.id, maxSelect: 1, cascadeDelete: true },
      { name: 'owner', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: false },
    ],
    listRule: 'owner = @request.auth.id',
    viewRule: 'owner = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: 'owner = @request.auth.id',
    deleteRule: 'owner = @request.auth.id',
  })
  app.save(scripts)
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId('scripts'))
  } catch {}
})
