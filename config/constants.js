const status = {
  PENDING: 0,
  PROCESSING: 1,
  COMPLETED: 2,
  FAILED: 3,
  properties: {
    0: { 'msg': 'pending' },
    1: { 'msg': 'processing' },
    2: { 'msg': 'completed' },
    3: { 'msg': 'failed' }
  }
}

const step = {
  INIT: 0,
  COMPILE_START: 1,
  COMPILE_END: 2,
  IMPORT_START: 3,
  IMPORT_END: 4,
  COMPUTATION_START: 5,
  COMPUTATION_END: 6,
  COMPLETED: 6,
  properties: {
    0: { 'msg': 'Init SMPC Computation' },
    1: { 'msg': 'Compiling MPC code' },
    2: { 'msg': 'MPC code compilation finished' },
    3: { 'msg': 'Importing data' },
    4: { 'msg': 'Data Importation Finished' },
    5: { 'msg': 'Computation started' },
    6: { 'msg': 'Computation completed' },
    7: { 'msg': 'Completed.' }
  }
}

module.exports = {
  status: Object.freeze(status),
  step: Object.freeze(step)
}
