const { createHandler } = require('@app-core/server');
const createCreatorCard = require('@app/services/creator-cards/create-creator-card');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards',
  method: 'post',
  async handler(rc, helpers) {
    const data = await createCreatorCard(rc.body);
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATED,
      data,
    };
  },
});
