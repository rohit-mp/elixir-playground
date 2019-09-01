defmodule Chatroomserver do
  require Logger
  import IEx.Helpers
  use Agent
  @moduledoc """
  Documentation for Chatroomserver.
  """

  @doc """
  Hello world.

  ## Examples

      iex> Chatroomserver.hello()
      :world

  """
  def hello do
    :world
  end

  def accept(port \\ 4041) do
    {:ok, socket} = :gen_tcp.listen(port, [:binary, packet: :line, active: false, reuseaddr: true])
    Logger.info("Accepting connection on port #{port}")
    names = spawn(fn -> name_map(%{}) end)
    clients = spawn(fn -> client_list([]) end)
    Process.register(names, :names)
    Process.register(clients, :client)
    loop_acceptor(socket, :names)
  end

  defp name_map(map) do 
    receive do
      {:get, key, caller} -> 
        send(caller, Map.get(map, key))
        name_map(map)
      {:get_all, caller} ->
        send(caller, map)
        name_map(map)
      {:put, key, value} ->
        name_map(Map.put(map, key, value))
    end
  end 

  defp client_list(list) do
    receive do
      {:add, value} -> client_list([value | list])
      {:remove, value} -> client_list(Enum.reject(list, fn x -> x == value end))
    end
  end

  defp loop_acceptor(socket, :names, :clients) do
    {:ok, client} = :gen_tcp.accept(socket)
    # send(:clients, )
    spawn(fn -> get_name(client, :names) end)
    loop_acceptor(socket, :names, :clients)
  end

  defp get_name(client, :names, :clients) do 
    :gen_tcp.send(client, "Enter your name: ")
    {:ok, name} = :gen_tcp.recv(client, 0)
    send(:names, {:put, client, name})
    send(:clients, {:add, client})
    serve(client, :names, name, :clients)
  end 

  defp serve(client, :names, name, :clients) do
    data = read_line(client)
    case data do
      :exit -> send(:clients, {:remove, client})
    send(:names, {:get_all, self()})
    receive do
    Enum.each(flush(), fn a -> 
      cond do
        a == :ok -> :ok
        {k, v} != {client, _} -> :gen_tcp.send(k, v <> ": " <> data)
        k == client -> :ok
      end 
    end)
    serve(client, :names, name, :clients)
  end

  defp read_line(client) do
    {:ok, data} = :gen_tcp.recv(client, 0)
    data
  end
end
