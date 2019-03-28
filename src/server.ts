import { Application, CoreBindings } from '@loopback/core';
import { Context, inject } from '@loopback/context';
import { Connection } from 'amqplib';
import { Logger } from 'winston';
import { AuthService } from './services/auth.service';
import { MonitorService } from './services/monitor.service';

export class Server extends Context implements Server {
    private _listening: boolean = false;

    @inject('logger')
    private logger: Logger;

    @inject('amqp.conn')
    private amqpConn: Connection;

    @inject('queue.job.start')
    private startTestQueue: string;

    @inject('config.job.id')
    private jobId: string;

    @inject('services.auth')
    private authService: AuthService;

    @inject('services.monitor')
    private monitorService: MonitorService;

    constructor(@inject(CoreBindings.APPLICATION_INSTANCE) public app?: Application) {
        super(app);
    }

    get listening() {
        return this._listening;
    }

    async start(): Promise<void> {
        const createJobChannel = await this.amqpConn.createChannel();

        const queue = `${this.startTestQueue}.${this.jobId}`;

        const qok: any = await createJobChannel.assertExchange(queue, 'fanout', {durable: false});

        await createJobChannel.assertQueue('', {exclusive: true});

        await createJobChannel.bindQueue(qok.queue, queue, '');

        await createJobChannel.consume(qok.queue, async () => {
            const token = await this.authService.login();

            await this.monitorService.monitor(token);

        }, {noAck: true});
    }

    async stop(): Promise<void> {
        await this.amqpConn.close();
    }
}
