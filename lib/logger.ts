// // Simple logger utility for the application

// /**
//  * Logger utility with different log levels
//  */
// export const log = {
//     info: (message: string, data?: any) => {
//         console.log(`[INFO] ${message}`, data ? data : '');
//     },
//     warn: (message: string, data?: any) => {
//         console.warn(`[WARN] ${message}`, data ? data : '');
//     },
//     error: (message: string, data?: any) => {
//         console.error(`[ERROR] ${message}`, data ? data : '');
//     },
//     debug: (message: string, data?: any) => {
//         if (process.env.NODE_ENV !== 'production') {
//             console.debug(`[DEBUG] ${message}`, data ? data : '');
//         }
//     }
// };

// /**
//  * Function to create a logger with a specific context
//  * @param context The context for the logger (e.g. component name)
//  * @returns A logger with the context prefix
//  */
// export function createLogger(context: string) {
//     return {
//         info: (message: string, data?: any) => {
//             log.info(`[${context}] ${message}`, data);
//         },
//         warn: (message: string, data?: any) => {
//             log.warn(`[${context}] ${message}`, data);
//         },
//         error: (message: string, data?: any) => {
//             log.error(`[${context}] ${message}`, data);
//         },
//         debug: (message: string, data?: any) => {
//             log.debug(`[${context}] ${message}`, data);
//         }
//     };
// }

// export default log; 