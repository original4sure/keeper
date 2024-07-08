export  * from "./keeper"
export * from "./pool"
import { debug as _debug } from "debug";
import { availablePools } from "./keeper";
const log = _debug('keeper')

setInterval(() => {
    const entries = Object.entries(availablePools)
    if (!entries.length) {
      log('Pool list empty')
      return
    }
    entries.forEach(([uri, pool]) => {
      log(JSON.stringify({ uri, info: pool.getInfo() }))
    })
  }, Number(process.env.LOG_KEEPER_INTERVAL) || 10000)
  