import { Application, CoreBindings } from '@loopback/core';
import { Context, inject } from '@loopback/context';
import { Connection } from 'amqplib';
import { Logger } from 'winston';
import { AuthService } from './services/auth.service';
import { MonitorService } from './services/monitor.service';
import { CfStatsService } from './services/cloud-foundry/cf-stats.service';
import { KubernetesService } from './services/KubernetesService';

/**
 * Starts the Cloud Foundry monitoring service
 */
export class Server extends Context implements Server {
    private _listening: boolean = false;

    @inject('logger')
    private logger: Logger;

    @inject('amqp.conn')
    private amqpConn: Connection;

    @inject('queue.job.start')
    private startTestQueue: string;

    @inject('queue.job.complete')
    private jobCompleteQueue: string;

    @inject('config.job.id')
    private jobId: string;

    @inject('services.auth')
    private authService: AuthService;

    @inject('services.monitor')
    private monitorService: MonitorService;

    @inject('services.cfAppStats')
    private cfStatsService: CfStatsService;

    @inject('services.kubernetes')
    private kubernetesService: KubernetesService;

    constructor(@inject(CoreBindings.APPLICATION_INSTANCE) public app?: Application) {
        super(app);
    }

    get listening() {
        return this._listening;
    }

    /**
     * Start the monitor
     */
    async start(): Promise<void> {
        const startTestChannel = await this.amqpConn.createChannel();
        const jobCompleteChannel = await this.amqpConn.createChannel();

        const startTestQok: any = await startTestChannel.assertExchange(this.startTestQueue, 'fanout', {durable: false});
        const jobCompleteQok: any = await jobCompleteChannel.assertExchange(this.jobCompleteQueue, 'fanout', {durable: false});

        await startTestChannel.assertQueue('', {exclusive: true});
        await jobCompleteChannel.assertQueue('', {exclusive: true});

        await startTestChannel.bindQueue(startTestQok.queue, this.startTestQueue, '');
        await jobCompleteChannel.bindQueue(jobCompleteQok.queue, this.jobCompleteQueue, '');

        this.logger.info('Logging in');
        const token = await this.authService.login();

        this.logger.info('Logged in');
        this.logger.info(token);

        const apps = await this.monitorService.monitor(token);

        // Start Monitoring
        startTestChannel.consume(startTestQok.queue, async () => {
            this.logger.info('Monitoring has started');
            await this.cfStatsService.monitor(token, apps);
        }, {noAck: true});

        // Shutdown pod
        jobCompleteChannel.consume(jobCompleteQok.queue, async () => {
            this.logger.info('Shutting down self');
            await this.kubernetesService.shutdown();
        }, {noAck: true});
    }

    async stop(): Promise<void> {
        await this.amqpConn.close();
    }
}
