# Golf Card
This is an app to share golf scores live with your friends.

**Link to project:** https://golf-card.netlify.app/

![Image of a room with multiple users](/images/room.png "Golf Card Room")

## Features

- Options to create and join a room
- Automatically rejoins a room if you have recently (in the last 18 hours) been in one
- Removes stale data (server side) if room has not been looked at in 18 hours
- Automatically updates on refocus and shows stale data while refetching
- Optimistic updates when creating a new hole or updating your own score
- Shareable links that allow receivers to directly join a room

## How It's Made:

**Technology used:** Typescript, React, React Query, React Router, Vite, Tailwind, Express, Prisma, Postgres, Netflify, and Railway.

Typescript:
- Type safety

React Query:
- to update data on refocus
- optimistic updates

React Router:
- client-side routing
- with local storage, returning users can rejoin a room
- shareable links to easily join a room

Tailwind:
- Removes duplicate CSS code
- keep bundle size down as an app gets larger

Prisma
- Typesafe DB access

## Optimizations
I initially started development with Websockets and socket.io. This led to a lot of imperative code that felt harder to maintain and extend.It also felt unneccasary and as if it would add a larger workload to both client and server. In this use case, it felt sufficient to have the score update on focus and after taking actions.

### Further Changes
Port to Remix
- This would remove a lot of boilerplate I had to write to connect libraries manually (though I learned a lot)

Use JWT
- Better security than just passing the user ID
- Better server-side routing (with a full stack framework) for recent users returning to the app

Use Vitest
- Add tests to ensure resiliency for future changes

## Lessons Learned:
Changing stack halfway through, i.e. from Websockets to Request Response with React query, can lead to untangling tech debt.
How to use React Query, overall and in particular for optimistic updates.
Building an MVP quickly and initially, and then throwing it away, will teach you more about how to structure code and what tech choices to make.
e.g. this would have helped me remove WebSockets earlier and potentially even go to Remix earlier.
 
