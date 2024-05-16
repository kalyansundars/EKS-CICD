import { Stack } from "aws-cdk-lib";
//import { BuildSpec, PipelineProject } from "aws-cdk-lib/aws-codebuild";
import { Artifact } from "aws-cdk-lib/aws-codepipeline";
import { CodeBuildAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { ManagedPolicy, Policy } from "aws-cdk-lib/aws-iam";
import * as iam from "aws-cdk-lib/aws-iam";
import { PipelineConfig } from "../../config/pipleline-config";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import { LinuxBuildImage } from "aws-cdk-lib/aws-codebuild";

//cdk.aws_codecommit.Repository
export class DeployStage {
    private readonly stack: Stack;
    private readonly appName: string;
    private readonly buildOutput: Artifact;

    constructor(stack: Stack) {
        this.stack = stack;
        this.appName = PipelineConfig.serviceName;    
        this.buildOutput = new Artifact();
    }

    public getCodeDeployAction = (sourceOutput: Artifact, repo: codecommit.Repository): CodeBuildAction => {
        return new CodeBuildAction({
            actionName: "Deploy-Action",
            input: sourceOutput,
            project: this.createCodeDeployProject(repo),
            outputs: [this.buildOutput],
            variablesNamespace: 'Variables_Deploy_Deploy-Action'
        });
    }
    
    public createCodeDeployProject = (repo: any): codebuild.Project => {        
        const codeDeployProject = new codebuild.Project(this.stack, 'codedeployproject', {
            projectName: `${this.appName}-CodeDeploy-Project`,
            environment: {
                buildImage: LinuxBuildImage.AMAZON_LINUX_2_4,
                privileged: true,                 
            },
            source: codebuild.Source.codeCommit({
                repository: repo,
                branchOrRef: 'master',                
            }),
            buildSpec: codebuild.BuildSpec.fromSourceFilename('deploy/' + `${PipelineConfig.environment}` + '/buildspec.yml'),
            environmentVariables: this.getEnvironmentVariables(),            
          });
          
        // codeDeployProject.role?.addManagedPolicy(            
        //     ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser')
        // );
        codeDeployProject.role?.attachInlinePolicy(new iam.Policy(this.stack, 'cluster-inline-policy', {
            statements: [new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              resources: [
                "*"
              ],
              actions: [
                "eks:*"
              ]
            })]
        }))
        return codeDeployProject;
    }

    private getEnvironmentVariables = () => {
        return {
            ACCOUNT_ID: {
                value: this.stack.account
            },
            ACCOUNT_REGION: {
                value: this.stack.region
            },
            ECR_REPO: {
                value: `${this.appName}-${PipelineConfig.buildStage.ecrRepositoryName}`
            },  
            ENVIRONMENT: {
                value: PipelineConfig.environment
            },   
            HELM_RELEASE_NAME: {
                value: PipelineConfig.deployStage.helmReleaseName
            },
            NAMESPACE: {
                value: PipelineConfig.deployStage.namespace
            },
            EKS_CLUSTER_NAME: {
                value: PipelineConfig.deployStage.clusterName
            },          
        };
    }
    
    public getDeployOutput = (): Artifact => {
        return this.buildOutput;
    }
}