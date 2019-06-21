const { status } = require('../config/constants')

const computations = [
  {
    key: 'ef6b9799-b51d-4b32-ad31-101cb766f47c',
    value: {
      attributes: [{'name': 'Ethnicity'}],
      filters: [null],
      algorithm: '1d_categorical_histogram',
      id: 'ef6b9799-b51d-4b32-ad31-101cb766f47c',
      timestamps:
      {accepted: 1557102417136, done: 1557103955216},
      status: status.COMPLETED,
      results: {
        x: ['white', 'bangladeshi', 'pakistani', 'black', 'indian', 'other', 'other asian', 'chinese'],
        y: [1252, 385, 201, 346, 201, 431, 184, 0]
      }
    }
  },
  {
    key: '9c5570ff-e929-473d-902b-45e28bf66e7a',
    value: {
      attributes: [
        {
          name: 'Patient Age',
          cells: '5'
        }
      ],
      filters: [
        {
          attribute: 'Patient Age',
          operator: '>',
          value: '50'
        }
      ],
      'data-providers': [
        'data-provider-2',
        'data-provider-3'
      ],
      algorithm: '1d_numerical_histogram',
      id: '9c5570ff-e929-473d-902b-45e28bf66e7a',
      timestamps: {
        accepted: 1556965833368,
        done: 1556969634972
      },
      status: status.COMPLETED,
      results: {
        min: 18,
        max: 85,
        y: [
          '675',
          '881',
          '783',
          '452',
          '209'
        ],
        cells: 5
      }
    }
  },
  {
    key: '6dd68636-bc9e-41bb-acf9-4d8ab8abbe10',
    value: {
      attributes: [
        {
          name: 'Gender'
        },
        {
          name: 'Ethnicity'
        }
      ],
      filters: [
        null
      ],
      algorithm: '2d_categorical_histogram',
      id: '6dd68636-bc9e-41bb-acf9-4d8ab8abbe10',
      timestamps: {
        accepted: 1556997732193,
        done: 1557003282304
      },
      status: status.COMPLETED,
      results: {
        z: [
          [
            '881',
            '274',
            '141',
            '282',
            '128',
            '295',
            '152',
            '0'
          ],
          [
            '371',
            '111',
            '60',
            '64',
            '73',
            '136',
            '32',
            '0'
          ]
        ],
        labels: {
          y: [
            'male',
            'female'
          ],
          x: [
            'white',
            'bangladeshi',
            'pakistani',
            'black',
            'indian',
            'other',
            'other asian',
            'chinese'
          ]
        }
      }
    }
  },
  {
    key: '1dbb7a04-9e80-45c7-990b-77ef9ac5f940',
    value: {
      attributes: [
        {
          name: 'LVEDV (ml)',
          cells: '5'
        },
        {
          name: 'LVSV (ml)',
          cells: '7'
        }
      ],
      filters: [
        null
      ],
      algorithm: '2d_numerical_histogram',
      timestamps: {
        accepted: 1555365157281,
        done: 1555367233972
      },
      id: '1dbb7a04-9e80-45c7-990b-77ef9ac5f940',
      status: status.COMPLETED,
      results: {
        min: [
          139.478,
          112.105
        ],
        max: [
          230.46,
          168.447
        ],
        z: [
          [
            '60',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0'
          ],
          [
            '0',
            '3',
            '0',
            '0',
            '3',
            '0',
            '0'
          ],
          [
            '0',
            '0',
            '0',
            '24',
            '0',
            '15',
            '27'
          ],
          [
            '0',
            '0',
            '9',
            '21',
            '3',
            '0',
            '45'
          ],
          [
            '0',
            '0',
            '0',
            '0',
            '0',
            '72',
            '15'
          ]
        ],
        cellsX: 5,
        cellsY: 7
      }
    }
  },
  {
    key: '1952eb79-2267-4def-b3ae-084f9f18399f',
    value: {
      attributes: [
        {
          name: 'Patient Age',
          cells: '5'
        },
        {
          name: 'Gender'
        }
      ],
      filters: [
        null
      ],
      algorithm: '2d_mixed_histogram',
      id: '1952eb79-2267-4def-b3ae-084f9f18399f',
      timestamps: {
        accepted: 1555877466313,
        done: 1555882323852
      },
      status: status.COMPLETED,
      results: {
        min: 18,
        max: 85,
        z: [
          [
            '466',
            '603',
            '544',
            '364',
            '176'
          ],
          [
            '209',
            '278',
            '239',
            '88',
            '33'
          ]
        ],
        y: [
          'male',
          'female'
        ],
        cells: 5
      }
    }
  }
]

module.exports = computations
