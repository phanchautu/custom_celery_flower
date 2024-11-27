FROM python:3.6.9-alpine

RUN apk add --no-cache ca-certificates tzdata && update-ca-certificates

EXPOSE 5555

ENV FLOWER_DATA_DIR /app

COPY ./flower $FLOWER_DATA_DIR/flower

WORKDIR $FLOWER_DATA_DIR

COPY ./requirements/default.txt $FLOWER_DATA_DIR/requirements.txt

RUN pip3 install --no-cache-dir -r $FLOWER_DATA_DIR/requirements.txt

VOLUME $FLOWER_DATA_DIR

CMD ["python3", "flower", "flower-aioz"]