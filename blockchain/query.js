/*
 * Copyright IBM Corp All Rights Reserved
 *
 * SPDX-License-Identifier: Apache-2.0
 */
/*
 * Chaincode query
 */

const util = require('util')

const isJSON = str => {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}

module.exports = {
  cc_query: (request, channel) => {
    let status = '200'
    let message = ''
    let response = ''
    let ret = ''

    return channel
      .queryByChaincode(request)
      .then(queryResponses => {
        // console.log("Query has completed, checking results");
        // queryResponses could have more than one  results if there multiple peers were used as targets
        // console.log(queryResponses[0].response.status);
        if (queryResponses && queryResponses.length === 1) {
          if (queryResponses[0] instanceof Error) {
            status = '500'
            message = queryResponses[0]
            // console.error("error from query = ", queryResponses[0]);
          } else {
            // console.log(util.format( '{status : %s response : "%s" }', status, queryResponses[0].toString()));
            response = queryResponses[0].toString()
          }
        } else {
          // console.log("No payloads were returned from query");

          status = '500'
          message = 'no payload returned from query'
        }
      })
      .catch(err => {
        status = '500'
        message = err
        // console.error('Failed to query successfully :: ' + err);
      })
      .then(() => {
        let msg = ''
        if (message.message) {
          msg = message.message
        }

        if (isJSON(response)) {
          ret = util.format(
            '{"status" : "%s", "response" : %s, "message" : %s }',
            status,
            response,
            JSON.stringify(msg)
          )
        } else {
          ret = util.format(
            '{"status" : "%s", "response" : %s, "message" : %s }',
            status,
            JSON.stringify(response),
            JSON.stringify(msg)
          )
        }

        return ret
      })
  }
}
