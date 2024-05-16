import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { PipelineConfig } from '../config/pipleline-config';
import { SourceStage } from './stages/source-stage';
import { BuildStage } from './stages/build-stage';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { DeployStage } from './stages/deploy-stage';


export class AwscdkEksCodepipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appName = PipelineConfig.serviceName;

    //Create and Init ECR Repo
    const repository = new ecr.Repository(this, 'EcrRepository', {
      repositoryName: `${appName}-${PipelineConfig.buildStage.ecrRepositoryName}`
    });

    //Create and Init the codecommit Repo
    const repo = new codecommit.Repository(this, 'Repository', {
      repositoryName: `${appName}-${PipelineConfig.sourceStage.repositoryName}`,
      description: 'microservice repo',
      code: codecommit.Code.fromDirectory(path.join(__dirname, '../initRepo/'), 'master')
    });

    //Init Pipeline
    const codepipeline = new Pipeline(this, 'pipeline', {      
      crossAccountKeys: false
    })

    //Source Stage
    const sourceStage = new SourceStage(this);
    codepipeline.addStage({
        stageName: "Source",
        actions: [sourceStage.getCodeCommitSourceAction()],
    });

    //Build Stage
    const buildStage = new BuildStage(this);
    codepipeline.addStage({
        stageName: "Build",
        actions: [buildStage.getCodeBuildAction(sourceStage.getSourceOutput(), repo)]
    });

    //Deploy Stage
    const deployStage = new DeployStage(this);
    codepipeline.addStage({
        stageName: "Deploy",
        actions: [deployStage.getCodeDeployAction(sourceStage.getSourceOutput(), repo)]
    });
  }
}
