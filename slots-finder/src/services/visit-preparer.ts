import { HttpService } from './http';
import { User, UserVisitResponse } from '../internal-types';
import { AnswerQuestionRequest, PrepareVisitData } from '../api';
import { Answers, QuestionResolver } from './question-resolver/question-resolver';
import { ErrorCode } from '../consts';

interface PrepareRequestSuccess {
  status: 'SUCCESS',
  data: PrepareVisitData
}

interface PrepareRequestFailed {
  status: 'FAILED',
  data: {
    errorCode: ErrorCode
  }
}

type PrepareVisitResponse = PrepareRequestSuccess | PrepareRequestFailed

export class VisitPreparer {

  constructor(private readonly httpService: HttpService) {
  }

  private buildAnswerRequestFrame(question: PrepareVisitData): Omit<AnswerQuestionRequest, 'AnswerIds' | 'AnswerText'> {
    return {
      PreparedVisitToken: question.PreparedVisitToken,
      QuestionId: question.QuestionnaireItem.QuestionId,
      QuestionnaireItemId: question.QuestionnaireItem.QuestionnaireItemId

    };
  }

  private extractDataByAnswer(answer: Answers, user: User): string {
    switch (answer) {
      case Answers.Id:
        return user.id;
      case Answers.PhoneNumber:
        return user.phone;
    }
    return '';
  }

  private async answer(question: PrepareVisitData, user: User): Promise<PrepareVisitResponse> {
    if (QuestionResolver.isDone(question)) {
      console.log('Done with questions');
      return {
        status: 'SUCCESS',
        data: question
      };
    }
    if (QuestionResolver.hasErrors(question)) {
      console.log('Found an error', question);
      return {
        status: 'FAILED',
        data: {
          errorCode: QuestionResolver.hasErrors(question) as ErrorCode
        }
      };
    }
    const whatToAnswer = QuestionResolver.resolveAnswer(question);
    const request: AnswerQuestionRequest = {
      ...this.buildAnswerRequestFrame(question),
      ...(whatToAnswer === Answers.VisitType ? {
          AnswerIds: [77],
          AnswerText: null
        } :
        {
          AnswerIds: null,
          AnswerText: this.extractDataByAnswer(whatToAnswer, user)
        })
    };
    const nextQuestion = await this.httpService.answer(request);
    console.log(JSON.stringify(nextQuestion));
    return this.answer(nextQuestion, user);
  }

  async prepare(user: User, serviceId: number): Promise<UserVisitResponse> {
    const initialQuestion = await this.httpService.prepareVisit(serviceId);
    console.log(JSON.stringify(initialQuestion));
    const response = await this.answer(initialQuestion, user);
    if (response.status === 'SUCCESS') {
      return {
        status: 'SUCCESS',
        data: {
          user,
          visitId: response.data.PreparedVisitId,
          visitToken: response.data.PreparedVisitToken
        }

      };
    }
    return {
      status: 'FAILED',
      data: {
        errorCode: response.data.errorCode
      }
    };
  }
}
