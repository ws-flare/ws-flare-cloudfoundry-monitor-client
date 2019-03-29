export interface AppStat {
    state: 'RUNNING' | 'CRASHED' | 'STOPPED';
    isolation_segment: string;
    stats: {
        usage: {
            disk: number;
            mem: number;
            cpu: number;
            time: string;
        },
        name: string;
        uris: string[];
        host: string;
        port: number;
        uptime: number;
        mem_quota: number;
        disk_quota: number;
        fds_quota: number;
    }
}
