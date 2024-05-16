import { Stack } from "aws-cdk-lib";
//import { BuildSpec, PipelineProject } from "aws-cdk-lib/aws-codebuild";
import { Artifact } from "aws-cdk-lib/aws-codepipeline";
import { CodeBuildAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { IRepository, Repository} from "aws-cdk-lib/aws-ecr";
import { ManagedPolicy } from "aws-cdk-lib/aws-iam";
import { PipelineConfig } from "../../config/pipleline-config";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import { LinuxBuildImage, Project } from "aws-cdk-lib/aws-codebuild";

//cdk.aws_codecommit.Repository
export class BuildStage {
    private readonly stack: Stack;
    private readonly appName: string;
    private readonly ecrRepository: IRepository
    private readonly buildOutput: Artifact;

    constructor(stack: Stack) {
        this.stack = stack;
        this.appName = PipelineConfig.serviceName;    
        this.ecrRepository = Repository.fromRepositoryName(this.stack, `EcrRepo-${PipelineConfig.serviceName}`, PipelineConfig.buildStage.ecrRepositoryName);
        this.buildOutput = new Artifact();
    }
    
    public getCodeBuildAction = (sourceOutput: Artifact, repo: codecommit.Repository): CodeBuildAction => {
        return new CodeBuildAction({
            actionName: "Build-Action",
            input: sourceOutput,
            project: this.createCodeBuildProject(repo),
            outputs: [this.buildOutput],
            variablesNamespace: 'Variables_Build_Build-Action'
        });
    }
    
    public createCodeBuildProject = (repo: any): codebuild.Project => {        
        const codeBuildProject = new codebuild.Project(this.stack, 'codebuildproject', {
            projectName: `${this.appName}-CodeBuild-Project`,
            environment: {
                buildImage: LinuxBuildImage.AMAZON_LINUX_2_4,
                privileged: true,                 
            },
            source: codebuild.Source.codeCommit({
                repository: repo,
                branchOrRef: 'master'
            }),
            environmentVariables: this.getEnvironmentVariables(),
          });
          
        codeBuildProject.role?.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser')
        );        
        return codeBuildProject;
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
        };
    }
    
    public getBuildOutput = (): Artifact => {
        return this.buildOutput;
    }
}