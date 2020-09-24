# koatuu-to-bigquery
load koatuu from https://data.gov.ua/dataset/dc081fb0-f504-4696-916c-a5b24312ab6e to Google BigQuey in denormalized form

## purpose
maintain table with koatuu numbers in BQ dataset. Autmaticaly update it with new values.

## secrets && scheduler
All secrets stored in Travis, also recurent builds scheduled inside travis to update database each month.
