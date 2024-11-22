import { notFound } from "next/navigation";

export default async function ListLayout({ children, params }
    : { children: any, params: { id: string } }
) {
    // Get course
    const request = await fetch(`${process.env.API_HOST}/lists/${params.id}`, {
        method: "GET",
    })
        .then(res => res.status == 200 ? res : console.log('List not found'))
        .catch(err => console.log(err));

    if (!request) return notFound();

    return children;
}

