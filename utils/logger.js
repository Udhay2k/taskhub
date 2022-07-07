const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const path = require('path');

const logger = createLogger({
    transports: [
        new transports.File({
            filename: path.join(__dirname, '../log/err.log'),
            level: 'error',
            format: combine(
                timestamp(),
                printf(info => {
                    return `${info.timestamp} ${info.level}: ${info.message}`;
                })
            )
        }),
        new transports.Http({
            level: 'warn',
            filename: path.join(__dirname, '../log/console.log'),
            format: format.json()
        }),
        new transports.File({
            level: 'info',
            filename: path.join(__dirname, '../log/console.log'),
            format: combine(
                timestamp(),
                printf(info => {
                    return `${info.timestamp} ${info.level}: ${info.message}`;
                })
            )
        })
    ]
});

module.exports = logger;