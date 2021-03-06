#POST /reactions

The POST reactions endpoint will be used to create a new DRE reaction.

### Example Request Header
Here is an example header to insure the proper header values are being passed:

```
POST /api/reactions HTTP/1.1
Host: dre.540.co
Content-Type: application/json

<!-- For example request body see below -->
```

###Example Request Body
This is the payload that should be present in the request body for the `POST` request to `/reactions`.

```
{
  "reaction": "<reaction>",
}
```

### Example Successful Response
Below is a response to a `POST` to the `/reactions` API if none of the below error conditions has occurred and everything is `200 OK`.

```
{
  "meta": {
    "execution_time": "0.004s",
    "total_count": 333
  },
  "data": {
    "reaction": "<reaction>",
    "definitions": [
      {
        "definition": "<text>",
        "source": "<source>",
        "created_at": "yyyy-mm-dd hh:mm:ss",
        "created_by": "dre-app",
        "votes": {
          "up": 1,
          "down": 4
         }
      }
      ...
    ],
    "created_at": "yyyy-mm-dd hh:mm:ss",
    "created_by": "dre-harvester"
  }
}
```


### Error Response

Below is a table showing the errors that could be returned on the endpoint.

|Status Code | Description |
|------------|-------------|
| 400        | `reaction` attribute not found... required |
| 400        | Any other root attributes other than `reaction`|
| 400        | Any request `Content-Type` other than `application/json` |
| 400        | `reaction` node being anything other than a String node |
| 422        | Duplicate `reaction` (one that already exists in the database) |


For more information on the format of the error responses please see the [API Error Response Page](./errors.md).
