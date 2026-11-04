const test=require('node:test'),assert=require('node:assert/strict');
const {plannerFailureMessage}=require('../lib/planner/request-failure.ts');
test('planner distinguishes authentication, entitlement and rate-limit responses',()=>{
 assert.match(plannerFailureMessage('en',{status:401,code:'AUTHENTICATION_REQUIRED'}),/sign in again/);
 assert.match(plannerFailureMessage('en',{status:403,code:'PAYMENT_REQUIRED'}),/active subscription/);
 assert.match(plannerFailureMessage('en',{status:429,code:'RATE_LIMITED'}),/wait/);
});
test('planner reports timeout and a safe server reference without exposing raw errors',()=>{
 assert.match(plannerFailureMessage('en',{name:'AbortError'}),/too long/);
 const result=plannerFailureMessage('en',{status:422,code:'WEEKLY_PLAN_FAILED',message:'secret private profile'});
 assert.match(result,/HTTP 422.*WEEKLY_PLAN_FAILED/);assert.doesNotMatch(result,/secret private/);
 assert.doesNotMatch(plannerFailureMessage('en',{status:500,code:'PRIVATE_KEY_123'}),/PRIVATE_KEY_123/);
});
test('planner failure explanations are localized',()=>{assert.match(plannerFailureMessage('hi',{status:401}),/कृपया/);assert.match(plannerFailureMessage('kn',{status:401}),/ಮತ್ತೆ/)});
