import { db } from '../../../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const url = new URL(request.url);
        const col = url.searchParams.get('col') || 'engineers';
        console.log("delete engineer with ID: " + id);

        const engineerRef = doc(db, col, id);
        console.log("Engineer reference: ", engineerRef);

        await updateDoc(engineerRef, { hidden: true });
        console.log("Engineer soft deleted successfully");

        return NextResponse.json({ message: 'Engineer soft deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting engineer:', error);
        return NextResponse.json({ error: 'Failed to delete engineer' }, { status: 500 });
    }
}
