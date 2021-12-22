export default ({ request, response }) => {
  // response.status = 404;
  response.body = {
    code: 404,
    msg: `Path <code>${request.url}</code> not found.`,
  };
  // response.body = `<html><body><h1>404 - Not Found</h1><p>Path <code>${request.url}</code> not found.`,
};
