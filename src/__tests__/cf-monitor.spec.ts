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
            .reply(200, 'token-abc');

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
    });
});
