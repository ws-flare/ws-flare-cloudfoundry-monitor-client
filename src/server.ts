import { Application, CoreBindings } from '@loopback/core';
import { Context, inject } from '@loopback/context';
import { Connection } from 'amqplib';
import { Logger } from 'winston';
import { AuthService } from './services/auth.service';
import { MonitorService } from './services/monitor.service';
import { CfStatsService } from './services/cloud-foundry/cf-stats.service';

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

    @inject('services.cfAppStats')
    private cfStatsService: CfStatsService;

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

        this.logger.info('Logging in');
        const token = await this.authService.login();

        this.logger.info('Logged in');
        this.logger.info(token);

        const apps = await this.monitorService.monitor(token);

        await createJobChannel.consume(qok.queue, async () => {
            this.logger.info('Monitoring has started');
            await this.cfStatsService.monitor(token, apps);
        }, {noAck: true});
    }

    async stop(): Promise<void> {
        await this.amqpConn.close();
    }
}
