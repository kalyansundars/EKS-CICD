import { Stack } from "aws-cdk-lib";
import { Artifact } from "aws-cdk-lib/aws-codepipeline";
import { CodeCommitSourceAction } from "aws-cdk-lib/aws-codepipeline-actions";
import {IRepository, Repository} from "aws-cdk-lib/aws-codecommit";
import { PipelineConfig } from "../../config/pipleline-config";

export class SourceStage {
    private readonly repository: IRepository;
    private readonly appName: string;
    private stack: Stack;
    private readonly sourceOutput: Artifact;

    constructor(stack: Stack) {
        this.stack = stack;
        this.appName = PipelineConfig.serviceName;
        this.sourceOutput = new Artifact();

        this.repository = Repository.fromRepositoryName(stack,
            `${this.appName}-${PipelineConfig.sourceStage.repositoryName}`,
            `${this.appName}-${PipelineConfig.sourceStage.repositoryName}`);        
    }

    public getCodeCommitSourceAction = (): CodeCommitSourceAction => {
        return new CodeCommitSourceAction({
            actionName: "Source-Action",
            output: this.sourceOutput,
            variablesNamespace: 'variables_Source_Source-Action',
            repository: this.repository,
            branch: 'master'
        });
    }

    public getSourceOutput = (): Artifact => {
        return this.sourceOutput;
    }
}