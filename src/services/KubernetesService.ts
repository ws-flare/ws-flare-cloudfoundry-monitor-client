import { inject } from '@loopback/core';
import ApiRoot = KubernetesClient.ApiRoot;
import { Logger } from 'winston';

export class KubernetesService {

    @inject('logger')
    private logger: Logger;

    @inject('config.pod.name')
    private podName: string;

    @inject('kubernetes.client')
    private kubernetesClient: ApiRoot;

    async shutdown() {
        await this.kubernetesClient.api.v1.namespaces('default').pod(`${this.podName}`).delete();
    }
}
