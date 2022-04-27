FROM public.ecr.aws/lambda/nodejs:14

COPY package.json .
RUN npm i
COPY . .
RUN npm run build

# You can overwrite command in `serverless.yml` template
CMD ["app.handler"]
