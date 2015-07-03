import { adder } from './adderModule'
import func from './callerModule';

global.moduleResult = adder(func());