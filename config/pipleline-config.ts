import {IPipelineConfigProps} from "../lib/PipelineConfigProps";

export const PipelineConfig: IPipelineConfigProps = {    
    serviceName: 'eks-cicd',
    sourceStage: {
        repositoryName: 'microservice'
    },
    buildStage: {
        ecrRepositoryName: 'microservice',
    },
    deployStage: {
        helmReleaseName: 'microservice-chart',
        namespace: 'default',
        clusterName: 'eks-cicd-aws'
    },
    environment: 'dev'  
}