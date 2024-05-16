export interface IPipelineConfigProps {
    serviceName: string;
    sourceStage: ISourceStage;   
    buildStage: IBuildStage;
    deployStage: IDeployStage;
    environment: 'dev'|'test'|'prod';
}

export interface ISourceStage {
    repositoryName: string;
}

export interface IBuildStage {
    ecrRepositoryName: string
    buildSpec?: any
}

export interface IDeployStage {
    helmReleaseName: string
    namespace: string
    clusterName: string
}