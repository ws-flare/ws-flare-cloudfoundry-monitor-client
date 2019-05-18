import { inject } from '@loopback/core';
import { json } from 'web-request';
import { AppStat } from '../../models/app-stat.model';
import { Token } from '../../models/token.model';
import { App } from '../../models/app.model';
import { each, forever, forEachOf } from 'async';
import { Logger } from 'winston';
import { CfMonitorService } from '../apis/cf-monitor.service';

/**
 * Service for getting monitor statistics from Cloud Foundry applications
 */
export class CfStatsService {

    @inject('logger')
    private logger: Logger;

    @inject('cf.api')
    private cfApi: string;

    @inject('services.cfMonitor')
    private cfMonitorService: CfMonitorService;

    /**
     * Get application usage statistics on Cloud Foundry
     *
     * @param token - Access token
     * @param appId - App id
     */
    async getAppStats(token: Token, appId: string): Promise<{ [key: string]: AppStat }> {
        return await json(`${this.cfApi}/v2/apps/${appId}/stats`, {
            headers: {
                Authorization: `${token.token_type} ${token.access_token}`
            },
            throwResponseError: true,
            strictSSL: false
        });
    }

    /**
     * Queries the app usage statistics every second until the test job has finished
     *
     * @param token - Access token
     * @param apps - Apps to monitor
     */
    async monitor(token: Token, apps: App[]) {
        forever(next => {
            this.logger.info('In forever and monitoring');
            this.monitorInParallel(token, apps)
                .then(() => this.wait())
                .then(() => next())
                .catch(err => next(err))
        }, (err: Error) => {
            this.logger.error(err);
        });
    }

    /**
     * Monitors all applications in parallel
     *
     * @param token - Access token
     * @param apps - Applications to monitor
     */
    private monitorInParallel(token: Token, apps: App[]) {
        return new Promise((resolve, reject) => {
            each(apps, (app, callback) => {
                this.getAppStats(token, app.metadata.guid)
                    .then((appStat) => this.recordUsage(app, appStat))
                    .then(() => callback())
                    .catch(err => callback(err))
            }, (err) => err ? reject(err) : resolve());
        });
    }

    /**
     * Records the usage statistics of an application on Cloud Foundry in the ws-flare-cloud-foundry-monitor-api
     * @param app
     * @param stats
     */
    private recordUsage(app: App, stats: { [key: string]: AppStat }) {
        return new Promise((resolve, reject) => {
            forEachOf(stats, (item, key, callback) => {
                this.cfMonitorService.createUsage(app, item, key as string)
                    .then(() => callback())
                    .catch((err) => callback(err));
            }, (err) => err ? reject(err) : resolve());
        });
    }

    /**
     * Wait for 1 second
     */
    async wait() {
        return new Promise(resolve => setTimeout(() => resolve(), 1000));
    }
}
