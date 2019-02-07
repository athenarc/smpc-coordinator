const status = {
  PENDING: 0,
  PROCESSING: 1,
  COMPLETED: 2,
  properties: {
    0: { 'msg': 'pending' },
    1: { 'msg': 'processing' },
    2: { 'msg': 'completed' }
  }
}

const step = {
  COMPILING: 0,
  RUNNING: 1,
  OUTPUT: 2,
  COMPLETED: 3,
  IMPORTING: 4,
  properties: {
    0: { 'msg': 'Compiling mpc code' },
    1: { 'msg': 'Running smpc computation' },
    2: { 'msg': 'Generating output' },
    3: { 'msg': 'Computation completed' },
    4: { 'msg': 'Importing data' }
  }
}

module.exports = {
  status: Object.freeze(status),
  step: Object.freeze(step)
}
