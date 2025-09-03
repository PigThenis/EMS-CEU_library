import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function DELETE(req: NextRequest) {
  try {
    // In production, you'd want to verify admin privileges here
    // For development, we'll allow it
    
    const firestore = getAdminFirestore();
    
    // Get all events_raw documents
    const eventsSnapshot = await firestore.collection('events_raw').get();
    
    if (eventsSnapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: 'No events to clear',
        deleted: 0 
      });
    }
    
    // Delete in batches (Firestore limit is 500 per batch)
    const batchSize = 500;
    let deleted = 0;
    
    const deletePromises = [];
    let batch = firestore.batch();
    let operationCount = 0;
    
    for (const doc of eventsSnapshot.docs) {
      batch.delete(doc.ref);
      operationCount++;
      deleted++;
      
      if (operationCount === batchSize) {
        deletePromises.push(batch.commit());
        batch = firestore.batch();
        operationCount = 0;
      }
    }
    
    // Commit remaining batch
    if (operationCount > 0) {
      deletePromises.push(batch.commit());
    }
    
    // Wait for all batches to complete
    await Promise.all(deletePromises);
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully cleared ${deleted} events`,
      deleted 
    });
    
  } catch (error) {
    console.error('Error clearing events:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to clear events',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
