import { Channel } from 'amqplib';
import { apis, Container, getAMQPConn, restoreFS, setupK8sConfig, startMqContainer } from './test-helpers';
import * as nock from 'nock';
import { expect } from 'chai';
import * as WebSocket from 'ws';
import { CloudFoundryMonitorApplication } from '../application';
import { main } from '..';

/**
 * Tests to make sure the kubernetes pod shuts down correctly
 */
describe('Shutdown', () => {

    const jobCompleteQueue = 'job.complete.job1';
    const cfMonitorReadyQueue = 'cfMonitor.ready.cf-monitor-1';

    let app: CloudFoundryMonitorApplication;
    let container: Container;
    let port: number;
    let jobCOmpleteChannel: Channel;
    let cfMonitorReadyChannel: Channel;
    let cfControllerInterceptor: any;
    let cfLoginInterceptor: any;
    let cfOrgsOneInterceptor: any;
    let cfOrgsTwoInterceptor: any;
    let cfSpacesOneInterceptor: any;
    let cfSpacesTwoInterceptor: any;
    let cfAppsOneInterceptor: any;
    let cfAppsTwoInterceptor: any;
    let shutdownSelf: any;
    let wsServer: WebSocket.Server;

    beforeEach(async () => {
        cfControllerInterceptor = nock(apis.cfApi)
            .intercept('/v2/info', 'GET')
            .reply(200, {authorization_endpoint: 'http://cf.com'});

        cfLoginInterceptor = nock('http://cf.com')
            .intercept('/oauth/token', 'POST', {
                grant_type: 'password',
                client_id: 'cf',
                username: 'user1',
                password: 'pass1'
            })
            .reply(200, {
                token_type: 'Bearer',
                access_token: 'my-super-token'
            });

        cfOrgsOneInterceptor = nock('http://cf.com')
            .intercept('/v2/organizations?page=1', 'GET')
            .reply(200, {
                total_pages: 10,
                resources: [
                    {
                        entity: {
                            name: 'unknown'
                        }
                    }
                ]
            });

        cfOrgsTwoInterceptor = nock('http://cf.com')
            .intercept('/v2/organizations?page=1', 'GET')
            .reply(200, {
                total_pages: 10,
                resources: [
                    {
                        metadata: {
                            guid: 'org1-guid'
                        },
                        entity: {
                            name: 'org1'
                        }
                    }
                ]
            });

        cfSpacesOneInterceptor = nock('http://cf.com')
            .intercept(`/v2/organizations/org1-guid/spaces?page=1`, 'GET')
            .reply(200, {
                total_pages: 10,
                resources: [
                    {
                        entity: {
                            name: 'unknown'
                        }
                    }
                ]
            });

        cfSpacesTwoInterceptor = nock('http://cf.com')
            .intercept(`/v2/organizations/org1-guid/spaces?page=1`, 'GET')
            .reply(200, {
                total_pages: 10,
                resources: [
                    {
                        metadata: {
                            guid: 'space1-guid'
                        },
                        entity: {
                            name: 'space1'
                        }
                    }
                ]
            });

        cfAppsOneInterceptor = nock('http://cf.com')
            .intercept('/v2/spaces/space1-guid/apps?page=1', 'GET')
            .reply(200, {
                total_pages: 10,
                resources: [
                    {
                        metadata: {
                            guid: 'app1-guid'
                        },
                        entity: {
                            name: 'app1'
                        }
                    },
                    {
                        metadata: {
                            guid: 'app2-guid'
                        },
                        entity: {
                            name: 'app2'
                        }
                    }
                ]
            });

        cfAppsTwoInterceptor = nock('http://cf.com')
            .intercept('/v2/spaces/space1-guid/apps?page=1', 'GET')
            .reply(200, {
                total_pages: 10,
                resources: [
                    {
                        metadata: {
                            guid: 'app3-guid'
                        },
                        entity: {
                            name: 'app3'
                        }
                    },
                    {
                        metadata: {
                            guid: 'app3-guid'
                        },
                        entity: {
                            name: 'app4'
                        }
                    }
                ]
            });

        shutdownSelf = nock('http://localhost:9000')
            .intercept(/\/api\/v1\/namespaces\/default\/pods\/pod1/g, 'DELETE')
            .reply(200, {});

        ({container, port} = await startMqContainer());

        setupK8sConfig();

        app = await main({amqp: {port}});

        const conn = await getAMQPConn(port);
        jobCOmpleteChannel = await conn.createChannel();
        cfMonitorReadyChannel = await conn.createChannel();

        await cfMonitorReadyChannel.assertQueue(cfMonitorReadyQueue);

        await jobCOmpleteChannel.assertExchange(jobCompleteQueue, 'fanout', {durable: false});
    });

    afterEach(async () => {
        await app.stop();
        await container.stop();

        nock.cleanAll();
        nock.restore();
        nock.activate();
        restoreFS();
    });

    it('should shutdown when job is completed', async () => {
        let cfMonitorReady = false;

        await cfMonitorReadyChannel.consume(cfMonitorReadyQueue, () => {
            cfMonitorReady = true;
        }, {noAck: true});

        await new Promise(resolve => setTimeout(() => resolve(), 2000));

        await jobCOmpleteChannel.publish(jobCompleteQueue, '', new Buffer((JSON.stringify({done: true}))));

        await new Promise(resolve => setTimeout(() => resolve(), 2000));

        // Auth
        expect(cfControllerInterceptor.isDone()).to.eql(true);
        expect(cfLoginInterceptor.isDone()).to.eql(true);

        // Organizations
        expect(cfOrgsOneInterceptor.isDone()).to.eql(true);
        expect(cfOrgsTwoInterceptor.isDone()).to.eql(true);

        // Spaces
        expect(cfSpacesOneInterceptor.isDone()).to.eql(true);
        expect(cfSpacesTwoInterceptor.isDone()).to.eql(true);

        // Apps
        expect(cfAppsOneInterceptor.isDone()).to.eql(true);
        expect(cfAppsTwoInterceptor.isDone()).to.eql(true);

        // Shutdown
        expect(shutdownSelf.isDone()).to.eql(true);

        expect(cfMonitorReady).to.eql(true);
    });
});
