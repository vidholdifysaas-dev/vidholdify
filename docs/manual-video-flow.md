# Manual Video Generation Flow

This flowchart illustrates the process of generating a "Manual Video" in VidHoldify, covering the creation, planning (with manual script bypass), scene generation, and final stitching.

```mermaid
flowchart TD
    subgraph Client ["Client Side (Frontend)"]
        A[User Fills Form] -->|Input: Product, Length, Script (Optional), Images| B(Call /api/manual-video/create)
        B -->|Job Created| C{Execute Immediately?}
        C -->|Yes: Generate Reference Image| D[Call /api/manual-video/generate]
        C -->|No: Just Create| E[Job Status: CREATED]
        E -->|User Triggers| D
    end

    subgraph API_Create ["API: Create Job"]
        B1[Validate Input]
        B2[Generate Job ID]
        B3[Save Job to DB]
        B4{Generate Image Only?}
        B4 -->|Yes| B5[Generate Reference Image (Nano Banana)]
        B5 --> B6[Upload to S3]
        B6 --> B7[return success + image URL]
        B4 -->|No| B8[return success + job ID]
    end

    subgraph API_Generate ["API: Generation Pipeline"]
        D --> G1[Fetch Job]
        G1 --> G2{Has Reference Image?}
        G2 -- No --> G3[Generate Reference Image (Nano Banana)]
        G3 --> G4[Upload to S3]
        G4 --> G5[Continue]
        G2 -- Yes --> G5[Use Existing Image]

        G5 --> H[Step 2: Script & Scene Planning]
        
        subgraph Planner ["Script Planner Logic"]
            H --> H1{User Script Provided?}
            H1 -- Yes --> H2[**Manual Split Algorithm**]
            H2 --> H2a[Split by Sentences/Clauses]
            H2a --> H2b[Map to Scene Durations (4s/6s/8s)]
            H2b --> H4[Create Scene Objects]
            
            H1 -- No --> H3[**Gemini AI Planner**]
            H3 --> H3a[Generate Script & Scene Breakdown]
            H3a --> H4
        end

        H4 --> I[Save Scenes to DB]
        I --> J[Step 3: Scene Generation]
        
        subgraph Veo_Gen ["Replicate Veo Generation"]
            J --> J1[Loop through Scenes]
            J1 --> J2{Generate Scene}
            J2 -->|Input| J3[Consistent Reference Image]
            J2 -->|Input| J4[Visual Prompt]
            J2 -->|Input| J5[Motion Description]
            J2 -->|Output| J6[Raw Video URL]
        end

        J6 --> K[Step 4: Persistence]
        K --> K1[Download Raw Video]
        K1 --> K2[Upload to S3]
        K2 --> K3[Update Scene Record]

        K3 --> L[Step 5: Stitching]
        L --> L1[Invoke Lambda Merger]
        L1 --> L2[FFmpeg Merge (Crossfades)]
        L2 --> L3[Upload Final Video to S3]

        L3 --> M[Step 6: Completion]
        M --> M1[Update Job Status: DONE]
        M1 --> M2[Add to Generated Videos]
    end

    B -.-> B1
    G5 --> H
    
    style H2 fill:#d4edda,stroke:#28a745,stroke-width:2px,color:black
    style H3 fill:#e2e3e5,stroke:#6c757d,stroke-width:2px,color:black
    style L1 fill:#fff3cd,stroke:#ffc107,stroke-width:2px,color:black
```

## detailed Steps

### 1. Job Creation
- **Endpoint**: `/api/manual-video/create`
- **Action**: Validates inputs, creates a job record.
- **Optional**: Can generate the reference image immediately if requested, which is useful for "Step 1" of a multi-step wizard.

### 2. Reference Image (Nano Banana)
- **Role**: Creates the "Actor" for the video.
- **Consistency**: This single image is used as the `image_ref` for ALL subsequent video generation steps to ensure the character looks the same.

### 3. Script Planning (The "Manual" Part)
- **File**: `configs/ai-services/script-planner.ts`
- **Logic**:
    - **If `userScript` is present**: The system **bypasses Gemini**. It intelligently splits the text into chunks attempting to respect sentence boundaries. It assigns these chunks to scene slots (e.g., a 30s video needs 4 scenes).
    - **If no script**: Gemini generates a script from scratch.

### 4. Scene Generation (Veo)
- **Engine**: Google Veo (via Replicate).
- **Process**: Generates individual 4s, 6s, or 8s clips.
- **Key Input**: The Signed URL of the Reference Image from S3.

### 5. Stitching
- **Engine**: AWS Lambda + FFmpeg.
- **Process**: Takes the S3 keys of all generated scenes and concatenates them into a single seamless MP4 file.
