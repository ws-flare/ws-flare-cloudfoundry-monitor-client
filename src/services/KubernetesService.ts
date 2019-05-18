import { inject } from '@loopback/core';
import ApiRoot = KubernetesClient.ApiRoot;
import { Logger } from 'winston';

/**
 * Service to interact with the Kubernetes API
 */
export class KubernetesService {

    @inject('logger')
    private logger: Logger;

    @inject('config.pod.name')
    private podName: string;

    @inject('kubernetes.client')
    private kubernetesClient: ApiRoot;

    /**
     * After tests complete shutdown the service to stop monitoring Cloud Foundry
     */
    async shutdown() {
        await this.kubernetesClient.api.v1.namespaces('default').pod(`${this.podName}`).delete();
    }
}
