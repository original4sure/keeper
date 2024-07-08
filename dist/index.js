"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./keeper"), exports);
__exportStar(require("./pool"), exports);
const debug_1 = require("debug");
const keeper_1 = require("./keeper");
const log = (0, debug_1.debug)('keeper');
setInterval(() => {
    const entries = Object.entries(keeper_1.availablePools);
    if (!entries.length) {
        log('Pool list empty');
        return;
    }
    entries.forEach(([uri, pool]) => {
        log(JSON.stringify({ uri, info: pool.getInfo() }));
    });
}, Number(process.env.LOG_KEEPER_INTERVAL) || 10000);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUF5QjtBQUN6Qix5Q0FBc0I7QUFDdEIsaUNBQXdDO0FBQ3hDLHFDQUEwQztBQUMxQyxNQUFNLEdBQUcsR0FBRyxJQUFBLGFBQU0sRUFBQyxRQUFRLENBQUMsQ0FBQTtBQUU1QixXQUFXLENBQUMsR0FBRyxFQUFFO0lBQ2IsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyx1QkFBYyxDQUFDLENBQUE7SUFDOUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7UUFDbkIsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUE7UUFDdEIsT0FBTTtLQUNQO0lBQ0QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDOUIsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUNwRCxDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFBIn0=