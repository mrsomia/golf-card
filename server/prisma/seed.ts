import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient()

async function main() {
	
	// This will clear the DB first if deletePrevious is true
	const deletePrevious = false
	if (deletePrevious) {
		await prisma.room.deleteMany()
		await prisma.hole.deleteMany()
		await prisma.userScore.deleteMany()
		await prisma.user.deleteMany()
	}

	const roomWithUsersAndHoles = await prisma.room.create({
		data: {
			name: faker.random.words(3).toLowerCase().replace(/ /g, '-'),
			users: {
				create: new Array(5).fill(0).map(_ => (
					{
						name: faker.name.firstName(),
					}
				))
			},
			holes: {
				create: new Array(9).fill(0).map((_, i) => (
					{
						number: ( i + 1 ),
						par: faker.datatype.number({
							min: 0,
							max: 6,
						}),
					}
				))
			}
		},
		include: {
			holes: true,
			users: true,
		}
	})
	
	console.log(roomWithUsersAndHoles)
	
	for (const user of roomWithUsersAndHoles.users) {
		for (const hole of roomWithUsersAndHoles.holes) {
			await prisma.userScore.create({
				data: {
					userId: user.id,
					holeId: hole.id,	
					score: faker.datatype.number({
						max: hole.par + 3,
						min: Math.max(0, hole.par -3),
					}),
				}
			})
		}
	}
	
	console.log(`seeded DB room name: ${roomWithUsersAndHoles.name}`)
}

main()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(() => {
		prisma.$disconnect()
	})
