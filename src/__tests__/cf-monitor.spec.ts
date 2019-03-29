import { Channel } from 'amqplib';
import { apis, Container, getAMQPConn, getWsServer, setupK8sConfig, startMqContainer } from './test-helpers';
import * as nock from 'nock';
import { expect } from 'chai';
import * as WebSocket from 'ws';
import { CloudFoundryMonitorApplication } from '../application';
import { main } from '..';

describe('CF Monitor', () => {

    const startTestQueue = 'job.start.job1';
    const cfMonitorReadyQueue = 'cfMonitor.ready.cf-monitor-1';

    let app: CloudFoundryMonitorApplication;
    let container: Container;
    let port: number;
    let startTestChannel: Channel;
    let cfMonitorReadyChannel: Channel;
    let cfControllerInterceptor: any;
    let cfLoginInterceptor: any;
    let cfOrgsOneInterceptor: any;
    let cfOrgsTwoInterceptor: any;
    let cfSpacesOneInterceptor: any;
    let cfSpacesTwoInterceptor: any;
    let cfAppsOneInterceptor: any;
    let cfAppsTwoInterceptor: any;
    let cfStatsOneInterceptor: any;
    let cfStatsTwoInterceptor: any;
    let cfStatsThreeInterceptor: any;
    let cfMonitorInterceptor: any;
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

        cfStatsOneInterceptor = nock('http://cf.com')
            .intercept('/v2/apps/app1-guid/stats', 'GET')
            .reply(200, {
                "0": {
                    "state": "RUNNING",
                    "isolation_segment": "iso-seg-name",
                    "stats": {
                        "usage": {
                            "disk": 66392064,
                            "mem": 29880320,
                            "cpu": 0.13511219703079957,
                            "time": "2014-06-19 22:37:58 +0000"
                        },
                        "name": "app_name",
                        "uris": [
                            "app_name.example.com"
                        ],
                        "host": "10.0.0.1",
                        "port": 61035,
                        "uptime": 65007,
                        "mem_quota": 536870912,
                        "disk_quota": 1073741824,
                        "fds_quota": 16384
                    }
                }
            });

        cfStatsTwoInterceptor = nock('http://cf.com')
            .intercept('/v2/apps/app2-guid/stats', 'GET')
            .reply(200, {
                "0": {
                    "state": "RUNNING",
                    "isolation_segment": "iso-seg-name",
                    "stats": {
                        "usage": {
                            "disk": 66392064,
                            "mem": 29880320,
                            "cpu": 0.13511219703079957,
                            "time": "2014-06-19 22:37:58 +0000"
                        },
                        "name": "app_name",
                        "uris": [
                            "app_name.example.com"
                        ],
                        "host": "10.0.0.1",
                        "port": 61035,
                        "uptime": 65007,
                        "mem_quota": 536870912,
                        "disk_quota": 1073741824,
                        "fds_quota": 16384
                    }
                }
            });

        cfStatsThreeInterceptor = nock('http://cf.com')
            .intercept('/v2/apps/app3-guid/stats', 'GET')
            .reply(200, {
                "0": {
                    "state": "RUNNING",
                    "isolation_segment": "iso-seg-name",
                    "stats": {
                        "usage": {
                            "disk": 66392064,
                            "mem": 29880320,
                            "cpu": 0.13511219703079957,
                            "time": "2014-06-19 22:37:58 +0000"
                        },
                        "name": "app_name",
                        "uris": [
                            "app_name.example.com"
                        ],
                        "host": "10.0.0.1",
                        "port": 61035,
                        "uptime": 65007,
                        "mem_quota": 536870912,
                        "disk_quota": 1073741824,
                        "fds_quota": 16384
                    }
                }
            });

        cfMonitorInterceptor = nock('http://monitor.com')
            .intercept('/usages', 'POST')
            .reply(200, {});

        wsServer = getWsServer();

        ({container, port} = await startMqContainer());

        setupK8sConfig();

        app = await main({amqp: {port}});

        const conn = await getAMQPConn(port);
        startTestChannel = await conn.createChannel();
        cfMonitorReadyChannel = await conn.createChannel();

        await cfMonitorReadyChannel.assertQueue(cfMonitorReadyQueue);

        await startTestChannel.assertExchange(startTestQueue, 'fanout', {durable: false});
    });

    afterEach(async () => {
        await app.stop();
        await container.stop();
        wsServer.close();

        nock.cleanAll();
        nock.restore();
        nock.activate();
    });

    it('should monitor cloud foundry', async () => {
        let cfMonitorReady = false;

        await cfMonitorReadyChannel.consume(cfMonitorReadyQueue, () => {
            cfMonitorReady = true;
        }, {noAck: true});

        await new Promise(resolve => setTimeout(() => resolve(), 2000));

        await startTestChannel.publish(startTestQueue, '', new Buffer((JSON.stringify({start: true}))));

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

        // Stats
        expect(cfStatsOneInterceptor.isDone()).to.eql(true);
        expect(cfStatsTwoInterceptor.isDone()).to.eql(true);
        expect(cfStatsThreeInterceptor.isDone()).to.eql(true);

        // Monitor API
        expect(cfMonitorInterceptor.isDone()).to.eql(true);

        expect(cfMonitorReady).to.eql(true);
    });
});
