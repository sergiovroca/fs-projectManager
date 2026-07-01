const express = require("express");

const app= express();
const PORT = 3000;
type Task={
    id: number;
    text: string;
    completed: boolean;
    priority: string;
};
const tasks: Task[] = [
    {id:1 , text:"Estudiar Node.js", completed:false, priority:"normal"},
    {id:2 , text:"Crear servidor Express", completed:true, priority:"normal"},
    {id:3 , text:"Probar las rutas del backend", completed:false, priority:"normal"}
];

app.get("/", (req: any, res:any)=>{
    res.send("Backend is working!");
});

app.get("/tasks", (req: any, res:any)=>{
    res.json(tasks);
});

app.delete("/tasks/:id", (req:any, res:any)=>{
    const id =Number(req.params.id);

    const taskExist = tasks.some((task)=> task.id ===id);
    if(!taskExist){
        return res.status(404).json({
            message: "Task not found"
        });
    }
    const updatedTasks =tasks.filter((task)=> task.id !== id);
    tasks.length= 0;
    tasks.push(...updatedTasks);

    res.json({
        message: "Taak deleted succesfully",
        tasks: tasks
    });
});

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})