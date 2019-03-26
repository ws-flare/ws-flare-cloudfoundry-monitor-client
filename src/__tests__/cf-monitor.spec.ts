import { Channel } from 'amqplib';
import { apis, Container, getAMQPConn, getWsServer, setupK8sConfig, startMqContainer } from './test-helpers';
import * as nock from 'nock';
import { expect } from 'chai';
import * as WebSocket from 'ws';
import { CloudFoundryMonitorApplication } from '../application';
import { main } from '..';

describe('CF Monitor', () => {

    const startTestQueue = 'job.start.job1';
    const nodeReadyQueue = 'node.ready.node1';

    let app: CloudFoundryMonitorApplication;
    let container: Container;
    let port: number;
    let startTestChannel: Channel;
    let nodeReadyChannel: Channel;
    let cfControllerInterceptor: any;
    let cfLoginInterceptor: any;
    let cfOrgsOneInterceptor: any;
    let cfOrgsTwoInterceptor: any;
    let cfSpacesOneInterceptor: any;
    let cfSpacesTwoInterceptor: any;
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
            .intercept('/v2/organizations?page=2', 'GET')
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
            .intercept(`/v2/organizations/org1-guid/spaces?page=2`, 'GET')
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

        wsServer = getWsServer();

        ({container, port} = await startMqContainer());

        setupK8sConfig();

        app = await main({amqp: {port}});

        const conn = await getAMQPConn(port);
        startTestChannel = await conn.createChannel();
        nodeReadyChannel = await conn.createChannel();

        await nodeReadyChannel.assertQueue(nodeReadyQueue);

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
        await new Promise(resolve => setTimeout(() => resolve(), 2000));

        await startTestChannel.publish(startTestQueue, '', new Buffer((JSON.stringify({start: true}))));

        await new Promise(resolve => setTimeout(() => resolve(), 2000));

        expect(cfControllerInterceptor.isDone()).to.eql(true);
        expect(cfLoginInterceptor.isDone()).to.eql(true);
        expect(cfOrgsOneInterceptor.isDone()).to.eql(true);
        expect(cfOrgsTwoInterceptor.isDone()).to.eql(true);
        expect(cfSpacesOneInterceptor.isDone()).to.eql(true);
        expect(cfSpacesTwoInterceptor.isDone()).to.eql(true);
    });
});
