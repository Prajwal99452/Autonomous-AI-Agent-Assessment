import { type NextRequest, NextResponse } from "next/server"
import { executeTask } from "@/lib/orchestrator"

export async function POST(request: NextRequest) {
  try {
    const { instruction } = await request.json()

    if (!instruction) {
      return NextResponse.json({ error: "Instruction is required" }, { status: 400 })
    }

    // Create a simple log collector
    const logs: string[] = []
    const logCallback = (message: string) => {
      logs.push(message)
    }

    // Execute the task
    const result = await executeTask(instruction, logCallback)

    return NextResponse.json({
      success: true,
      result,
      logs,
    })
  } catch (error) {
    console.error("Error executing task:", error)

    return NextResponse.json(
      {
        error: "Failed to execute task",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

